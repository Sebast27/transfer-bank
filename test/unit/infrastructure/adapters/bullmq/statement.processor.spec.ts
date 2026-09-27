import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Job } from 'bullmq';
import { QUEUE_PORT } from '../../../../../src/core/transfer-bank/application/ports/queue.port';
import { PDF_GENERATOR_PORT } from '../../../../../src/core/transfer-bank/application/ports/pdf-generator.port';
import { STATEMENT_REPOSITORY } from '../../../../../src/core/transfer-bank/domain/ports/statement-repository.port';
import { StatementProcessor } from '../../../../../src/infrastructure/adapters/bullmq/statement.processor';

describe('StatementProcessor', () => {
  let processor: StatementProcessor;
  let statementRepository: {
    updateStatus: any;
    findByIdWithAccount: any;
    completeStatement: any;
    markAsFailed: any;
  };
  let pdfGenerator: { generateStatement: any };
  let queuePort: { add: any };
  let moduleRef: TestingModule;

  const periodStart = new Date('2026-01-01T00:00:00.000Z');
  const periodEnd = new Date('2026-01-31T23:59:59.999Z');
  const statement = {
    id: 'statement-id',
    periodStart,
    periodEnd,
    account: {
      id: 'account-id',
      accountNumber: '1001',
      balance: 500,
      user: { id: 'user-id', email: 'user@example.com', name: 'User' },
      transactions: [
        {
          id: 'debit-id',
          fromAccountId: 'account-id',
          toAccountId: 'other-id',
          amount: 25,
          reference: null,
          createdAt: new Date('2026-01-10T12:00:00.000Z'),
        },
        {
          id: 'credit-id',
          fromAccountId: 'other-id',
          toAccountId: 'account-id',
          amount: 50,
          reference: 'incoming transfer',
          createdAt: periodEnd,
        },
        {
          id: 'outside-id',
          fromAccountId: 'account-id',
          toAccountId: 'other-id',
          amount: 100,
          reference: 'outside period',
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
      ],
    },
  };
  const job = (data: unknown) => ({ data }) as Job<unknown, unknown, string>;

  beforeEach(async () => {
    statementRepository = {
      updateStatus: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
      findByIdWithAccount: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(statement),
      completeStatement: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
      markAsFailed: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
    };
    pdfGenerator = {
      generateStatement: jest.fn<(...args: any[]) => Promise<any>>()
        .mockResolvedValue('statements/statement.pdf'),
    };
    queuePort = { add: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };

    moduleRef = await Test.createTestingModule({
      providers: [
        StatementProcessor,
        { provide: STATEMENT_REPOSITORY, useValue: statementRepository },
        { provide: PDF_GENERATOR_PORT, useValue: pdfGenerator },
        { provide: QUEUE_PORT, useValue: queuePort },
      ],
    }).compile();
    processor = moduleRef.get(StatementProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a statement for in-period transactions and enqueue a notification', async () => {
    // Arrange
    const data = { statementId: 'statement-id' };

    // Act
    const result = await processor.process(job(data));

    // Assert
    expect(statementRepository.updateStatus).toHaveBeenCalledWith('statement-id', 'PROCESSING');
    expect(pdfGenerator.generateStatement).toHaveBeenCalledWith({
      accountNumber: '1001',
      ownerName: 'User',
      balance: 500,
      periodStart,
      periodEnd,
      transactions: [
        {
          date: new Date('2026-01-10T12:00:00.000Z'),
          type: 'DEBIT',
          amount: 25,
          balance: 500,
          description: 'Transferencia',
        },
        {
          date: periodEnd,
          type: 'CREDIT',
          amount: 50,
          balance: 500,
          description: 'incoming transfer',
        },
      ],
    });
    expect(statementRepository.completeStatement).toHaveBeenCalledWith(
      'statement-id',
      'statements/statement.pdf',
    );
    expect(queuePort.add).toHaveBeenCalledWith('notification-queue', {
      to: 'user@example.com',
      subject: 'Account statement available',
      body: "Your account statement for 1001 It's ready. You can download it from the app.",
      template: 'statement-ready',
    });
    expect(result).toEqual({ success: true, filePath: 'statements/statement.pdf' });
  });

  it('should mark a missing statement as failed and rethrow the error', async () => {
    // Arrange
    statementRepository.findByIdWithAccount.mockResolvedValue(null);

    // Act & Assert
    await expect(processor.process(job({ statementId: 'missing' })))
      .rejects.toThrow('Statement missing not found');
    expect(statementRepository.markAsFailed).toHaveBeenCalledWith(
      'missing',
      'Statement missing not found',
    );
    expect(pdfGenerator.generateStatement).not.toHaveBeenCalled();
  });

  it('should mark a statement as failed when PDF generation fails', async () => {
    // Arrange
    const error = new Error('File generation failed');
    pdfGenerator.generateStatement.mockRejectedValue(error);

    // Act & Assert
    await expect(processor.process(job({ statementId: 'statement-id' }))).rejects.toBe(error);
    expect(statementRepository.markAsFailed).toHaveBeenCalledWith(
      'statement-id',
      'File generation failed',
    );
    expect(queuePort.add).not.toHaveBeenCalled();
  });

  it('should mark a statement as failed with an unknown error message for non-error rejections', async () => {
    // Arrange
    pdfGenerator.generateStatement.mockRejectedValue('unexpected rejection');

    // Act & Assert
    await expect(processor.process(job({ statementId: 'statement-id' })))
      .rejects.toBe('unexpected rejection');
    expect(statementRepository.markAsFailed).toHaveBeenCalledWith('statement-id', 'Unknown error');
  });

  it('should log when a statement job completes', () => {
    // Arrange
    const loggerLog = jest.spyOn((processor as any).logger, 'log').mockImplementation(() => undefined);
    const completedJob = { id: 'statement-job-id' } as Job;

    // Act
    processor.onCompleted(completedJob);

    // Assert
    expect(loggerLog).toHaveBeenCalledWith('🎉 Job statement-job-id completado con éxito');
  });

  it('should log the error when a statement job fails', () => {
    // Arrange
    const loggerError = jest.spyOn((processor as any).logger, 'error').mockImplementation(() => undefined);
    const failedJob = { id: 'statement-job-id' } as Job;
    const error = new Error('Statement generation failed');

    // Act
    processor.onFailed(failedJob, error);

    // Assert
    expect(loggerError).toHaveBeenCalledWith('💥 Job statement-job-id falló: Statement generation failed');
  });
});
