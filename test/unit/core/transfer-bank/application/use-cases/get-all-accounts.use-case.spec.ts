import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetAllAccountsUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/get-all-accounts.use-case';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../../../../../src/core/transfer-bank/domain/ports/account-repository.port';

describe('GetAllAccountsUseCase', () => {
  let useCase: GetAllAccountsUseCase;
  let module: TestingModule;
  let accountRepository: jest.Mocked<IAccountRepository>;

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
      providers: [GetAllAccountsUseCase, { provide: ACCOUNT_REPOSITORY, useValue: accountRepository }],
    }).compile();
    useCase = module.get(GetAllAccountsUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return all accounts from the repository', async () => {
    const accounts = [{
      accountNumber: 'ACC-001',
      balance: 125,
      owner: { email: 'owner@example.com', name: 'Account Owner' },
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    }];
    accountRepository.findAll.mockResolvedValue(accounts);

    const result = await useCase.execute();

    expect(result).toEqual(accounts);
    expect(accountRepository.findAll).toHaveBeenCalledTimes(1);
  });

  it('should return an empty list when there are no accounts', async () => {
    accountRepository.findAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(accountRepository.findAll).toHaveBeenCalledTimes(1);
  });
});
