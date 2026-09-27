import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ProcessTransferUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/process-transfer.use-case';
import { IQueuePort, QUEUE_PORT } from '../../../../../../src/core/transfer-bank/application/ports/queue.port';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '../../../../../../src/core/transfer-bank/domain/ports/transaction-repository.port';
import { Transaction } from '../../../../../../src/core/transfer-bank/domain/entities/transaction.entity';
import { Money } from '../../../../../../src/core/transfer-bank/domain/value-objects/money.vo';

describe('ProcessTransferUseCase', () => {
  let useCase: ProcessTransferUseCase;
  let module: TestingModule;
  let transactionRepository: jest.Mocked<ITransactionRepository>;
  let queuePort: jest.Mocked<IQueuePort>;
  const validDto = {
    fromAccount: 'ACC-001',
    toAccount: 'ACC-002',
    amount: 100,
    reference: 'Invoice payment',
  };
  const savedTransaction = new Transaction({
    id: 'transaction-1',
    fromAccount: 'ACC-001',
    toAccount: 'ACC-002',
    amount: new Money(100),
    reference: 'Invoice payment',
  });

  beforeEach(async () => {
    transactionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findAll: jest.fn(),
      completeTransfer: jest.fn(),
      markAsFailed: jest.fn(),
    };
    queuePort = { add: jest.fn() };
    module = await Test.createTestingModule({
      providers: [
        ProcessTransferUseCase,
        { provide: TRANSACTION_REPOSITORY, useValue: transactionRepository },
        { provide: QUEUE_PORT, useValue: queuePort },
      ],
    }).compile();
    useCase = module.get(ProcessTransferUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should save and enqueue a valid transfer', async () => {
    transactionRepository.save.mockResolvedValue(savedTransaction);
    queuePort.add.mockResolvedValue(undefined);

    const result = await useCase.execute(validDto);

    expect(result).toEqual({ transactionId: savedTransaction.id, status: 'PENDING' });
    expect(transactionRepository.save).toHaveBeenCalledTimes(1);
    const transaction = transactionRepository.save.mock.calls[0][0];
    expect(transaction).toBeInstanceOf(Transaction);
    expect(transaction.toJSON()).toMatchObject({
      fromAccount: 'ACC-001',
      toAccount: 'ACC-002',
      amount: 100,
      status: 'PENDING',
      reference: 'Invoice payment',
    });
    expect(queuePort.add).toHaveBeenCalledWith('process-transfer', {
      transactionId: 'transaction-1',
      fromAccountNumber: 'ACC-001',
      toAccountNumber: 'ACC-002',
      amount: 100,
    });
  });

  it('should reject an amount that is not positive', async () => {
    await expect(useCase.execute({ ...validDto, amount: 0 })).rejects.toThrow(BadRequestException);
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('should reject transfers to the same account', async () => {
    await expect(useCase.execute({ ...validDto, toAccount: validDto.fromAccount }))
      .rejects.toThrow(BadRequestException);
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('should reject an empty source account', async () => {
    await expect(useCase.execute({ ...validDto, fromAccount: '' })).rejects.toThrow(BadRequestException);
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('should reject a whitespace-only source account', async () => {
    await expect(useCase.execute({ ...validDto, fromAccount: '   ' })).rejects.toThrow(BadRequestException);
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('should reject an empty destination account', async () => {
    await expect(useCase.execute({ ...validDto, toAccount: '' })).rejects.toThrow(BadRequestException);
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('should reject a whitespace-only destination account', async () => {
    await expect(useCase.execute({ ...validDto, toAccount: '   ' })).rejects.toThrow(BadRequestException);
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('should reject transfers above the maximum amount', async () => {
    await expect(useCase.execute({ ...validDto, amount: 10001 })).rejects.toThrow(BadRequestException);
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('should reject references longer than 100 characters', async () => {
    await expect(useCase.execute({ ...validDto, reference: 'x'.repeat(101) }))
      .rejects.toThrow(BadRequestException);
    expect(transactionRepository.save).not.toHaveBeenCalled();
  });

  it('should mark the saved transfer as failed when it cannot be enqueued', async () => {
    transactionRepository.save.mockResolvedValue(savedTransaction);
    transactionRepository.updateStatus.mockResolvedValue(savedTransaction);
    queuePort.add.mockRejectedValue(new Error('Queue unavailable'));

    await expect(useCase.execute(validDto)).rejects.toThrow(BadRequestException);

    expect(transactionRepository.updateStatus).toHaveBeenCalledWith('transaction-1', 'FAILED');
    expect(queuePort.add).toHaveBeenCalledWith('process-transfer', {
      transactionId: 'transaction-1',
      fromAccountNumber: 'ACC-001',
      toAccountNumber: 'ACC-002',
      amount: 100,
    });
  });
});
