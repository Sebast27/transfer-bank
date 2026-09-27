import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Job } from 'bullmq';
import { QUEUE_PORT } from '../../../../../src/core/transfer-bank/application/ports/queue.port';
import { ACCOUNT_REPOSITORY } from '../../../../../src/core/transfer-bank/domain/ports/account-repository.port';
import { DEPOSIT_REPOSITORY } from '../../../../../src/core/transfer-bank/domain/ports/deposit-repository.port';
import { DepositProcessor } from '../../../../../src/infrastructure/adapters/bullmq/deposit.processor';

describe('DepositProcessor', () => {
  let processor: DepositProcessor;
  let depositRepository: { findById: any; completeDeposit: any };
  let accountRepository: Record<string, any>;
  let queuePort: { add: any };
  let moduleRef: TestingModule;

  const job = (data: unknown) => ({ data }) as Job<unknown, unknown, string>;
  const deposit = {
    id: 'deposit-id',
    accountId: 'account-id',
    amount: 75,
    account: {
      id: 'account-id',
      accountNumber: '1001',
      status: 'ACTIVE',
      user: { id: 'user-id', email: 'user@example.com', name: 'User' },
    },
  };

  beforeEach(async () => {
    depositRepository = {
      findById: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(deposit),
      completeDeposit: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
    };
    accountRepository = {};
    queuePort = { add: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };

    moduleRef = await Test.createTestingModule({
      providers: [
        DepositProcessor,
        { provide: DEPOSIT_REPOSITORY, useValue: depositRepository },
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepository },
        { provide: QUEUE_PORT, useValue: queuePort },
      ],
    }).compile();
    processor = moduleRef.get(DepositProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete a deposit and enqueue its notification', async () => {
    // Arrange
    const data = { depositId: 'deposit-id', accountId: 'account-id', amount: 75 };

    // Act
    const result = await processor.process(job(data));

    // Assert
    expect(depositRepository.findById).toHaveBeenCalledWith('deposit-id');
    expect(depositRepository.completeDeposit).toHaveBeenCalledWith('deposit-id', 'account-id', 75);
    expect(queuePort.add).toHaveBeenCalledWith('notification-queue', {
      to: 'user@example.com',
      subject: 'Depósito completado',
      body: 'Tu depósito de $75 en la cuenta 1001 ha sido completado exitosamente.',
      template: 'deposit-completed',
    });
    expect(result).toEqual({ success: true });
  });

  it('should reject when the deposit does not exist', async () => {
    // Arrange
    depositRepository.findById.mockResolvedValue(null);

    // Act & Assert
    await expect(processor.process(job({ depositId: 'missing', accountId: 'account-id', amount: 75 })))
      .rejects.toThrow('Deposit missing not found');
    expect(depositRepository.completeDeposit).not.toHaveBeenCalled();
    expect(queuePort.add).not.toHaveBeenCalled();
  });

  it('should reject deposits for inactive accounts', async () => {
    // Arrange
    depositRepository.findById.mockResolvedValue({
      ...deposit,
      account: { ...deposit.account, status: 'BLOCKED' },
    });

    // Act & Assert
    await expect(processor.process(job({ depositId: 'deposit-id', accountId: 'account-id', amount: 75 })))
      .rejects.toThrow('Account is BLOCKED');
    expect(depositRepository.completeDeposit).not.toHaveBeenCalled();
    expect(queuePort.add).not.toHaveBeenCalled();
  });

  it('should propagate completion and notification errors', async () => {
    // Arrange
    const completionError = new Error('Could not complete deposit');
    depositRepository.completeDeposit.mockRejectedValue(completionError);

    // Act & Assert
    await expect(processor.process(job({ depositId: 'deposit-id', accountId: 'account-id', amount: 75 })))
      .rejects.toBe(completionError);
    expect(queuePort.add).not.toHaveBeenCalled();
  });

  it('should reject when notification enqueueing fails after completing the deposit', async () => {
    // Arrange
    const queueError = new Error('Queue unavailable');
    queuePort.add.mockRejectedValue(queueError);

    // Act & Assert
    await expect(processor.process(job({ depositId: 'deposit-id', accountId: 'account-id', amount: 75 })))
      .rejects.toBe(queueError);
    expect(depositRepository.completeDeposit).toHaveBeenCalled();
  });

  it('should rethrow a non-Error rejection from deposit lookup', async () => {
    // Arrange
    depositRepository.findById.mockRejectedValue('Unexpected repository rejection');

    // Act & Assert
    await expect(processor.process(job({
      depositId: 'deposit-id',
      accountId: 'account-id',
      amount: 75,
    }))).rejects.toBe('Unexpected repository rejection');
    expect(depositRepository.completeDeposit).not.toHaveBeenCalled();
  });

  it('should log when a deposit job completes', () => {
    // Arrange
    const loggerLog = jest.spyOn((processor as any).logger, 'log').mockImplementation(() => undefined);
    const completedJob = { id: 'deposit-job-id' } as Job;

    // Act
    processor.onCompleted(completedJob);

    // Assert
    expect(loggerLog).toHaveBeenCalledWith('🎉 Job deposit-job-id completado con éxito');
  });

  it('should log the error when a deposit job fails', () => {
    // Arrange
    const loggerError = jest.spyOn((processor as any).logger, 'error').mockImplementation(() => undefined);
    const failedJob = { id: 'deposit-job-id' } as Job;
    const error = new Error('Deposit processing failed');

    // Act
    processor.onFailed(failedJob, error);

    // Assert
    expect(loggerError).toHaveBeenCalledWith('💥 Job deposit-job-id falló: Deposit processing failed');
  });
});
