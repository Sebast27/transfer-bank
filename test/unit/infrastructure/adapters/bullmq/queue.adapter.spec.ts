import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BullMQQueueAdapter } from '../../../../../src/infrastructure/adapters/bullmq/queue.adapter';

describe('BullMQQueueAdapter', () => {
  let adapter: BullMQQueueAdapter;
  let queues: Record<string, { add: any }>;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    queues = {
      transfer: { add: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) },
      statement: { add: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) },
      notification: { add: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) },
      deposit: { add: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) },
      withdrawal: { add: jest.fn<(...args: any[]) => Promise<any>>().mockResolvedValue(undefined) },
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        BullMQQueueAdapter,
        { provide: getQueueToken('transfer-queue'), useValue: queues.transfer },
        { provide: getQueueToken('statement-queue'), useValue: queues.statement },
        { provide: getQueueToken('notification-queue'), useValue: queues.notification },
        { provide: getQueueToken('deposit-queue'), useValue: queues.deposit },
        { provide: getQueueToken('withdrawal-queue'), useValue: queues.withdrawal },
      ],
    }).compile();
    adapter = moduleRef.get(BullMQQueueAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['statement-queue', 'statement', 'process-statement'],
    ['notification-queue', 'notification', 'send-notification'],
    ['deposit-queue', 'deposit', 'process-deposit'],
    ['withdrawal-queue', 'withdrawal', 'process-withdrawal'],
  ])('should forward %s jobs to the configured queue', async (queueName, queueKey, jobName) => {
    // Arrange
    const data = { id: 'job-id' };

    // Act
    await adapter.add(queueName, data);

    // Assert
    expect(queues[queueKey].add).toHaveBeenCalledWith(jobName, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    for (const [key, queue] of Object.entries(queues)) {
      if (key !== queueKey) {
        expect(queue.add).not.toHaveBeenCalled();
      }
    }
  });

  it('should forward other job names to the transfer queue unchanged', async () => {
    // Arrange
    const data = { transactionId: 'transaction-id' };
    const jobName = 'process-transfer';

    // Act
    await adapter.add(jobName, data);

    // Assert
    expect(queues.transfer.add).toHaveBeenCalledWith(jobName, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
  });

  it('should propagate queue errors', async () => {
    // Arrange
    const error = new Error('Queue unavailable');
    queues.deposit.add.mockRejectedValue(error);

    // Act & Assert
    await expect(adapter.add('deposit-queue', { id: 'deposit-id' })).rejects.toBe(error);
  });
});
