import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetAccountTransactionsUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/get-account-transactions.use-case';
import { GetTransactionsQueryDto, TransactionType } from '../../../../../../src/core/transfer-bank/application/dto/get-transactions-query.dto';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../../../../../src/core/transfer-bank/domain/ports/account-repository.port';
import { ITransactionHistoryRepository, TRANSACTION_HISTORY_REPOSITORY } from '../../../../../../src/core/transfer-bank/domain/ports/transaction-history-repository.port';

describe('GetAccountTransactionsUseCase', () => {
  let useCase: GetAccountTransactionsUseCase;
  let module: TestingModule;
  let accountRepository: jest.Mocked<IAccountRepository>;
  let transactionHistoryRepository: jest.Mocked<ITransactionHistoryRepository>;

  beforeEach(async () => {
    accountRepository = {
      findAll: jest.fn(),
      findByNumber: jest.fn(),
      findByNumberWithUser: jest.fn(),
      findUserByEmail: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };
    transactionHistoryRepository = { findByAccountId: jest.fn() };
    module = await Test.createTestingModule({
      providers: [
        GetAccountTransactionsUseCase,
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepository },
        { provide: TRANSACTION_HISTORY_REPOSITORY, useValue: transactionHistoryRepository },
      ],
    }).compile();
    useCase = module.get(GetAccountTransactionsUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return transactions filtered by type and date range', async () => {
    const fromDate = '2026-01-01T00:00:00.000Z';
    const toDate = '2026-01-31T23:59:59.000Z';
    const filters: GetTransactionsQueryDto = {
      type: TransactionType.TRANSFER,
      fromDate,
      toDate,
    };
    const transactions = [{
      id: 'transaction-1',
      type: 'TRANSFER' as const,
      amount: 50,
      direction: 'DEBIT' as const,
      status: 'COMPLETED',
      reference: null,
      date: new Date(fromDate),
    }];
    accountRepository.findByNumber.mockResolvedValue({
      id: 'account-1',
      accountNumber: 'ACC-001',
      balance: 100,
      status: 'ACTIVE',
      userId: 'user-1',
      updatedAt: new Date(),
    });
    transactionHistoryRepository.findByAccountId.mockResolvedValue(transactions);

    const result = await useCase.execute('ACC-001', 'user-1', filters);

    expect(result).toEqual(transactions);
    expect(transactionHistoryRepository.findByAccountId).toHaveBeenCalledWith('account-1', {
      type: TransactionType.TRANSFER,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
    });
  });

  it('should use all transaction types when no type filter is specified', async () => {
    accountRepository.findByNumber.mockResolvedValue({
      id: 'account-1',
      accountNumber: 'ACC-001',
      balance: 100,
      status: 'ACTIVE',
      userId: 'user-1',
      updatedAt: new Date(),
    });
    transactionHistoryRepository.findByAccountId.mockResolvedValue([]);

    await useCase.execute('ACC-001', 'user-1', {});

    expect(transactionHistoryRepository.findByAccountId).toHaveBeenCalledWith('account-1', {
      type: TransactionType.ALL,
      fromDate: undefined,
      toDate: undefined,
    });
  });

  it('should throw when the account does not exist', async () => {
    accountRepository.findByNumber.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'user-1', {})).rejects.toThrow(NotFoundException);
    expect(transactionHistoryRepository.findByAccountId).not.toHaveBeenCalled();
  });

  it('should forbid a non-owner from viewing account transactions', async () => {
    accountRepository.findByNumber.mockResolvedValue({
      id: 'account-1',
      accountNumber: 'ACC-001',
      balance: 100,
      status: 'ACTIVE',
      userId: 'user-1',
      updatedAt: new Date(),
    });

    await expect(useCase.execute('ACC-001', 'user-2', {})).rejects.toThrow(ForbiddenException);
    expect(transactionHistoryRepository.findByAccountId).not.toHaveBeenCalled();
  });
});
