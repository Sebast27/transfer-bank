import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetAllTransfersUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/get-all-transfers.use-case';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '../../../../../../src/core/transfer-bank/domain/ports/transaction-repository.port';

describe('GetAllTransfersUseCase', () => {
  let useCase: GetAllTransfersUseCase;
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
      providers: [GetAllTransfersUseCase, { provide: TRANSACTION_REPOSITORY, useValue: transactionRepository }],
    }).compile();
    useCase = module.get(GetAllTransfersUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return all transfers from the repository', async () => {
    const transfers = [{
      id: 'transfer-1',
      fromAccount: 'ACC-001',
      toAccount: 'ACC-002',
      amount: 50,
      status: 'COMPLETED',
      reference: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      completedAt: new Date('2026-01-01T00:01:00.000Z'),
    }];
    transactionRepository.findAll.mockResolvedValue(transfers);

    const result = await useCase.execute();

    expect(result).toEqual(transfers);
    expect(transactionRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return an empty list when there are no transfers', async () => {
    transactionRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
