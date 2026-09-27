import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AccountController } from '../../../../src/presentation/controllers/account.controller';
import { GET_ACCOUNT_BALANCE_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/get-account-balance.port';
import { GET_ACCOUNT_TRANSACTIONS_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/get-account-transactions.port';
import {
  GetTransactionsQueryDto,
  TransactionType,
} from '../../../../src/core/transfer-bank/application/dto/get-transactions-query.dto';
import { AuthenticatedUser, UserRole } from '../../../../src/presentation/types/authenticated-user.type';

type UseCaseMock = {
  execute: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
};

describe('AccountController', () => {
  let controller: AccountController;
  let module: TestingModule;
  let getBalanceUseCase: UseCaseMock;
  let getTransactionsUseCase: UseCaseMock;

  beforeEach(async () => {
    getBalanceUseCase = {
      execute: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    getTransactionsUseCase = {
      execute: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    module = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        { provide: GET_ACCOUNT_BALANCE_USE_CASE, useValue: getBalanceUseCase },
        {
          provide: GET_ACCOUNT_TRANSACTIONS_USE_CASE,
          useValue: getTransactionsUseCase,
        },
      ],
    }).compile();
    controller = module.get(AccountController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('getBalance', () => {
    it('should request the balance for the account and authenticated user', async () => {
      // Arrange
      const accountNumber = 'ACC-001';
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.USER,
        name: 'Test User',
      };
      const balance = { accountNumber, balance: 150 };
      getBalanceUseCase.execute.mockResolvedValue(balance);

      // Act
      const result = await controller.getBalance(accountNumber, user);

      // Assert
      expect(getBalanceUseCase.execute).toHaveBeenCalledWith(
        accountNumber,
        user.id,
        user.role,
      );
      expect(result).toBe(balance);
    });
  });

  describe('getTransactions', () => {
    it('should request transactions with the supplied filters and user', async () => {
      // Arrange
      const accountNumber = 'ACC-001';
      const filters: GetTransactionsQueryDto = {
        type: TransactionType.TRANSFER,
        fromDate: '2025-01-01',
      };
      const user: AuthenticatedUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: UserRole.USER,
        name: 'Test User',
      };
      const transactions = [{ id: 'transaction-1' }];
      getTransactionsUseCase.execute.mockResolvedValue(transactions);

      // Act
      const result = await controller.getTransactions(accountNumber, filters, user);

      // Assert
      expect(getTransactionsUseCase.execute).toHaveBeenCalledWith(
        accountNumber,
        user.id,
        filters,
      );
      expect(result).toBe(transactions);
    });
  });
});
