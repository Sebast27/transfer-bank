import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Job } from 'bullmq';
import { QUEUE_PORT } from '../../../../../src/core/transfer-bank/application/ports/queue.port';
import { WITHDRAWAL_REPOSITORY } from '../../../../../src/core/transfer-bank/domain/ports/withdrawal-repository.port';
import { WithdrawalProcessor } from '../../../../../src/infrastructure/adapters/bullmq/withdrawal.processor';

describe('WithdrawalProcessor', () => {
  let processor: WithdrawalProcessor;
  let withdrawalRepository: {
    findByIdWithAccount: any;
    completeWithdrawal: any;
    markAsFailed: any;
  };
  let queuePort: { add: any };
  let moduleRef: TestingModule;

  const withdrawal = {
    id: 'withdrawal-id',
    accountId: 'account-id',
    amount: 60,
    account: {
      id: 'account-id',
      accountNumber: '1001',
      balance: 200,
      status: 'ACTIVE',
      user: { id: 'user-id', email: 'user@example.com', name: 'User' },
    },
  };
  const data = { withdrawalId: 'withdrawal-id', accountId: 'account-id', amount: 60 };
  const job = (jobData: unknown) => ({ data: jobData }) as Job<unknown, unknown, string>;

  beforeEach(async () => {
    withdrawalRepository = {
      findByIdWithAccount: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(withdrawal),
      completeWithdrawal: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
      markAsFailed: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
    };
    queuePort = { add: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };

    moduleRef = await Test.createTestingModule({
      providers: [
        WithdrawalProcessor,
        { provide: WITHDRAWAL_REPOSITORY, useValue: withdrawalRepository },
        { provide: QUEUE_PORT, useValue: queuePort },
      ],
    }).compile();
    processor = moduleRef.get(WithdrawalProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete a withdrawal and enqueue its notification', async () => {
    // Arrange

    // Act
    const result = await processor.process(job(data));

    // Assert
    expect(withdrawalRepository.findByIdWithAccount).toHaveBeenCalledWith('withdrawal-id');
    expect(withdrawalRepository.completeWithdrawal).toHaveBeenCalledWith(
      'withdrawal-id',
      'account-id',
      60,
    );
    expect(queuePort.add).toHaveBeenCalledWith('notification-queue', {
      to: 'user@example.com',
      subject: 'Withdrawal completed',
      body: 'Your retirement from $60 de la cuenta 1001 has been successfully completed.',
      template: 'withdrawal-completed',
    });
    expect(result).toEqual({ success: true });
    expect(withdrawalRepository.markAsFailed).not.toHaveBeenCalled();
  });

  it('should mark missing withdrawals as failed', async () => {
    // Arrange
    withdrawalRepository.findByIdWithAccount.mockResolvedValue(null);

    // Act & Assert
    await expect(processor.process(job({ ...data, withdrawalId: 'missing' })))
      .rejects.toThrow('Withdrawal missing not found');
    expect(withdrawalRepository.markAsFailed).toHaveBeenCalledWith('missing');
    expect(withdrawalRepository.completeWithdrawal).not.toHaveBeenCalled();
  });

  it('should mark withdrawals from inactive accounts as failed', async () => {
    // Arrange
    withdrawalRepository.findByIdWithAccount.mockResolvedValue({
      ...withdrawal,
      account: { ...withdrawal.account, status: 'BLOCKED' },
    });

    // Act & Assert
    await expect(processor.process(job(data))).rejects.toThrow('Account is BLOCKED');
    expect(withdrawalRepository.markAsFailed).toHaveBeenCalledWith('withdrawal-id');
    expect(withdrawalRepository.completeWithdrawal).not.toHaveBeenCalled();
  });

  it('should mark withdrawals with insufficient funds as failed', async () => {
    // Arrange
    withdrawalRepository.findByIdWithAccount.mockResolvedValue({
      ...withdrawal,
      account: { ...withdrawal.account, balance: 20 },
    });

    // Act & Assert
    await expect(processor.process(job(data))).rejects.toThrow('Insufficient balance. Current: $20');
    expect(withdrawalRepository.markAsFailed).toHaveBeenCalledWith('withdrawal-id');
    expect(withdrawalRepository.completeWithdrawal).not.toHaveBeenCalled();
  });

  it('should mark a withdrawal as failed when completion fails', async () => {
    // Arrange
    const error = new Error('Withdrawal transaction failed');
    withdrawalRepository.completeWithdrawal.mockRejectedValue(error);

    // Act & Assert
    await expect(processor.process(job(data))).rejects.toBe(error);
    expect(withdrawalRepository.markAsFailed).toHaveBeenCalledWith('withdrawal-id');
  });

  it('should propagate notification queue failures after completing the withdrawal', async () => {
    // Arrange
    const error = new Error('Queue unavailable');
    queuePort.add.mockRejectedValue(error);

    // Act & Assert
    await expect(processor.process(job(data))).rejects.toBe(error);
    expect(withdrawalRepository.completeWithdrawal).toHaveBeenCalled();
    expect(withdrawalRepository.markAsFailed).toHaveBeenCalledWith('withdrawal-id');
  });

  it('should rethrow a non-Error rejection from withdrawal lookup', async () => {
    // Arrange
    withdrawalRepository.findByIdWithAccount.mockRejectedValue(
      'Unexpected repository rejection',
    );

    // Act & Assert
    await expect(processor.process(job(data))).rejects.toBe(
      'Unexpected repository rejection',
    );
    expect(withdrawalRepository.markAsFailed).toHaveBeenCalledWith('withdrawal-id');
  });

  it('should log when a withdrawal job completes', () => {
    // Arrange
    const loggerLog = jest.spyOn((processor as any).logger, 'log').mockImplementation(() => undefined);
    const completedJob = { id: 'withdrawal-job-id' } as Job;

    // Act
    processor.onCompleted(completedJob);

    // Assert
    expect(loggerLog).toHaveBeenCalledWith('🎉 Job withdrawal-job-id completado con éxito');
  });

  it('should log the error when a withdrawal job fails', () => {
    // Arrange
    const loggerError = jest.spyOn((processor as any).logger, 'error').mockImplementation(() => undefined);
    const failedJob = { id: 'withdrawal-job-id' } as Job;
    const error = new Error('Withdrawal processing failed');

    // Act
    processor.onFailed(failedJob, error);

    // Assert
    expect(loggerError).toHaveBeenCalledWith('💥 Job withdrawal-job-id falló: Withdrawal processing failed');
  });
});
