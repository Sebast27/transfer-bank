import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GenerateStatementUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/generate-statement.use-case';
import { RequestStatementDto } from '../../../../../../src/core/transfer-bank/application/dto/request-statement.dto';
import { IStatementRepository, STATEMENT_REPOSITORY } from '../../../../../../src/core/transfer-bank/domain/ports/statement-repository.port';
import { IQueuePort, QUEUE_PORT } from '../../../../../../src/core/transfer-bank/application/ports/queue.port';

describe('GenerateStatementUseCase', () => {
  let useCase: GenerateStatementUseCase;
  let module: TestingModule;
  let statementRepository: jest.Mocked<IStatementRepository>;
  let queuePort: jest.Mocked<IQueuePort>;

  beforeEach(async () => {
    statementRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithAccount: jest.fn(),
      updateStatus: jest.fn(),
      completeStatement: jest.fn(),
      markAsFailed: jest.fn(),
    };
    queuePort = { add: jest.fn() };
    module = await Test.createTestingModule({
      providers: [
        GenerateStatementUseCase,
        { provide: STATEMENT_REPOSITORY, useValue: statementRepository },
        { provide: QUEUE_PORT, useValue: queuePort },
      ],
    }).compile();
    useCase = module.get(GenerateStatementUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should create a statement and enqueue it for PDF generation', async () => {
    const dto: RequestStatementDto = {
      accountNumber: 'ACC-001',
      periodStart: '2026-01-01T00:00:00.000Z',
      periodEnd: '2026-01-31T00:00:00.000Z',
    };
    statementRepository.create.mockResolvedValue({ id: 'statement-1', status: 'PENDING' });
    queuePort.add.mockResolvedValue(undefined);

    const result = await useCase.execute(dto);

    expect(result).toEqual({
      statementId: 'statement-1',
      status: 'PENDING',
      accountNumber: 'ACC-001',
    });
    expect(statementRepository.create).toHaveBeenCalledWith({
      accountId: 'ACC-001',
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
    });
    expect(queuePort.add).toHaveBeenCalledWith('statement-queue', { statementId: 'statement-1' });
  });

  it('should propagate queue failures after creating the statement', async () => {
    const dto: RequestStatementDto = {
      accountNumber: 'ACC-001',
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
    };
    const queueError = new Error('Queue unavailable');
    statementRepository.create.mockResolvedValue({ id: 'statement-1', status: 'PENDING' });
    queuePort.add.mockRejectedValue(queueError);

    await expect(useCase.execute(dto)).rejects.toThrow(queueError);
    expect(statementRepository.create).toHaveBeenCalledTimes(1);
  });
});
