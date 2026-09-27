import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetAccountBalanceUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/get-account-balance.use-case';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../../../../../src/core/transfer-bank/domain/ports/account-repository.port';

describe('GetAccountBalanceUseCase', () => {
  let useCase: GetAccountBalanceUseCase;
  let module: TestingModule;
  let accountRepository: jest.Mocked<IAccountRepository>;
  const account = {
    id: 'account-1',
    accountNumber: 'ACC-001',
    balance: 250.5,
    status: 'ACTIVE',
    userId: 'user-1',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    accountRepository = {
      findAll: jest.fn(),
      findByNumber: jest.fn(),
      findByNumberWithUser: jest.fn(),
      findUserByEmail: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };
    module = await Test.createTestingModule({
      providers: [GetAccountBalanceUseCase, { provide: ACCOUNT_REPOSITORY, useValue: accountRepository }],
    }).compile();
    useCase = module.get(GetAccountBalanceUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return the balance to the account owner', async () => {
    accountRepository.findByNumber.mockResolvedValue(account);

    const result = await useCase.execute('ACC-001', 'user-1', 'USER');

    expect(result).toEqual({
      accountNumber: 'ACC-001',
      balance: 250.5,
      updatedAt: account.updatedAt,
    });
    expect(accountRepository.findByNumber).toHaveBeenCalledWith('ACC-001');
  });

  it('should allow an admin to view an account balance', async () => {
    accountRepository.findByNumber.mockResolvedValue(account);

    await expect(useCase.execute('ACC-001', 'admin-1', 'ADMIN'))
      .resolves.toEqual({ accountNumber: 'ACC-001', balance: 250.5, updatedAt: account.updatedAt });
  });

  it('should throw when the account does not exist', async () => {
    accountRepository.findByNumber.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'user-1', 'USER')).rejects.toThrow(NotFoundException);
  });

  it('should forbid a non-owner from viewing the balance', async () => {
    accountRepository.findByNumber.mockResolvedValue(account);

    await expect(useCase.execute('ACC-001', 'user-2', 'USER')).rejects.toThrow(ForbiddenException);
  });
});
