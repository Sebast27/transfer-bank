import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Job } from 'bullmq';
import { TRANSACTION_REPOSITORY } from '../../../../../src/core/transfer-bank/domain/ports/transaction-repository.port';
import { ACCOUNT_REPOSITORY } from '../../../../../src/core/transfer-bank/domain/ports/account-repository.port';
import { QUEUE_PORT } from '../../../../../src/core/transfer-bank/application/ports/queue.port';
import { TransferProcessor } from '../../../../../src/infrastructure/adapters/bullmq/transfer.processor';

describe('TransferProcessor', () => {
  let processor: TransferProcessor;
  let accountRepository: { findByNumberWithUser: any };
  let transactionRepository: { completeTransfer: any; markAsFailed: any };
  let queuePort: { add: any };
  let moduleRef: TestingModule;

  const sourceAccount = {
    id: 'source-id',
    accountNumber: '1001',
    balance: 200,
    status: 'ACTIVE',
    user: { email: 'sender@example.com', name: 'Sender' },
  };
  const destinationAccount = {
    id: 'destination-id',
    accountNumber: '2002',
    balance: 50,
    status: 'ACTIVE',
    user: { email: 'recipient@example.com', name: 'Recipient' },
  };
  const data = {
    transactionId: 'transaction-id',
    fromAccountNumber: '1001',
    toAccountNumber: '2002',
    amount: 75,
  };
  const job = (jobData: unknown) => ({ data: jobData }) as Job<unknown, unknown, string>;

  beforeEach(async () => {
    accountRepository = {
      findByNumberWithUser: jest.fn<(...args: any[]) => Promise<any>>()
        .mockResolvedValueOnce(sourceAccount)
        .mockResolvedValueOnce(destinationAccount),
    };
    transactionRepository = {
      completeTransfer: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
      markAsFailed: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined),
    };
    queuePort = { add: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) };

    moduleRef = await Test.createTestingModule({
      providers: [
        TransferProcessor,
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepository },
        { provide: TRANSACTION_REPOSITORY, useValue: transactionRepository },
        { provide: QUEUE_PORT, useValue: queuePort },
      ],
    }).compile();
    processor = moduleRef.get(TransferProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete a transfer and enqueue a notification to the sender', async () => {
    // Arrange

    // Act
    const result = await processor.process(job(data));

    // Assert
    expect(accountRepository.findByNumberWithUser).toHaveBeenNthCalledWith(1, '1001');
    expect(accountRepository.findByNumberWithUser).toHaveBeenNthCalledWith(2, '2002');
    expect(transactionRepository.completeTransfer).toHaveBeenCalledWith(
      'transaction-id',
      'source-id',
      'destination-id',
      75,
    );
    expect(queuePort.add).toHaveBeenCalledWith('notification-queue', {
      to: 'sender@example.com',
      subject: 'Transfer completed',
      body: 'Your transfer of $75 a 2002 has been successfully completed.',
      template: 'transfer-completed',
    });
    expect(result).toEqual({ success: true });
    expect(transactionRepository.markAsFailed).not.toHaveBeenCalled();
  });

  it.each([
    ['missing source accounts', null, destinationAccount, 'Source account 1001 not found'],
    ['missing destination accounts', sourceAccount, null, 'Destination account 2002 not found'],
    [
      'inactive source accounts',
      { ...sourceAccount, status: 'BLOCKED' },
      destinationAccount,
      'Source account is BLOCKED',
    ],
    [
      'inactive destination accounts',
      sourceAccount,
      { ...destinationAccount, status: 'BLOCKED' },
      'The destination account is BLOCKED',
    ],
    [
      'insufficient source balances',
      { ...sourceAccount, balance: 10 },
      destinationAccount,
      'Insufficient balance in 1001',
    ],
  ])('should mark transfers as failed for %s', async (_description, source, destination, message) => {
    // Arrange
    accountRepository.findByNumberWithUser
      .mockReset()
      .mockResolvedValueOnce(source)
      .mockResolvedValueOnce(destination);

    // Act & Assert
    await expect(processor.process(job(data))).rejects.toThrow(message as string);
    expect(transactionRepository.markAsFailed).toHaveBeenCalledWith('transaction-id');
    expect(transactionRepository.completeTransfer).not.toHaveBeenCalled();
    expect(queuePort.add).not.toHaveBeenCalled();
  });

  it('should mark the transaction as failed when transfer completion fails', async () => {
    // Arrange
    const error = new Error('Transfer transaction failed');
    transactionRepository.completeTransfer.mockRejectedValue(error);

    // Act & Assert
    await expect(processor.process(job(data))).rejects.toBe(error);
    expect(transactionRepository.markAsFailed).toHaveBeenCalledWith('transaction-id');
  });

  it('should rethrow errors when marking a failed transaction also fails', async () => {
    // Arrange
    const completionError = new Error('Transfer transaction failed');
    const failureUpdateError = new Error('Could not update transaction status');
    transactionRepository.completeTransfer.mockRejectedValue(completionError);
    transactionRepository.markAsFailed.mockRejectedValue(failureUpdateError);

    // Act & Assert
    await expect(processor.process(job(data))).rejects.toBe(failureUpdateError);
  });

  it('should mark the transaction failed when processing rejects with a non-Error value', async () => {
    // Arrange
    accountRepository.findByNumberWithUser.mockReset().mockRejectedValue('Unexpected repository rejection');

    // Act & Assert
    await expect(processor.process(job(data))).rejects.toBe('Unexpected repository rejection');
    expect(transactionRepository.markAsFailed).toHaveBeenCalledWith('transaction-id');
  });

  it('should log when a transfer job completes', () => {
    // Arrange
    const loggerLog = jest.spyOn((processor as any).logger, 'log').mockImplementation(() => undefined);
    const completedJob = { id: 'transfer-job-id' } as Job;

    // Act
    processor.onCompleted(completedJob);

    // Assert
    expect(loggerLog).toHaveBeenCalledWith('🎉 Job transfer-job-id completado con éxito');
  });

  it('should log the error when a transfer job fails', () => {
    // Arrange
    const loggerError = jest.spyOn((processor as any).logger, 'error').mockImplementation(() => undefined);
    const failedJob = { id: 'transfer-job-id' } as Job;
    const error = new Error('Transfer processing failed');

    // Act
    processor.onFailed(failedJob, error);

    // Assert
    expect(loggerError).toHaveBeenCalledWith('💥 Job transfer-job-id falló: Transfer processing failed');
  });
});
