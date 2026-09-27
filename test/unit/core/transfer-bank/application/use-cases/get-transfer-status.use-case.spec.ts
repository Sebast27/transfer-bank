import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetTransferStatusUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/get-transfer-status.use-case';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '../../../../../../src/core/transfer-bank/domain/ports/transaction-repository.port';
import { Money } from '../../../../../../src/core/transfer-bank/domain/value-objects/money.vo';
import { Transaction } from '../../../../../../src/core/transfer-bank/domain/entities/transaction.entity';

describe('GetTransferStatusUseCase', () => {
  let useCase: GetTransferStatusUseCase;
  let module: TestingModule;
  let transactionRepository: jest.Mocked<ITransactionRepository>;

  beforeEach(async () => {
    transactionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findAll: jest.fn(),
      completeTransfer: jest.fn(),
      markAsFailed: jest.fn(),
    };
    module = await Test.createTestingModule({
      providers: [GetTransferStatusUseCase, { provide: TRANSACTION_REPOSITORY, useValue: transactionRepository }],
    }).compile();
    useCase = module.get(GetTransferStatusUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return the serialized transaction status', async () => {
    const transaction = new Transaction({
      id: 'transfer-1',
      fromAccount: 'ACC-001',
      toAccount: 'ACC-002',
      amount: new Money(45),
      reference: 'Invoice',
    });
    transactionRepository.findById.mockResolvedValue(transaction);

    const result = await useCase.execute('transfer-1');

    expect(result).toEqual(transaction.toJSON());
    expect(transactionRepository.findById).toHaveBeenCalledWith('transfer-1');
  });

  it('should throw when the transaction does not exist', async () => {
    transactionRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing')).rejects.toThrow(NotFoundException);
  });
});
