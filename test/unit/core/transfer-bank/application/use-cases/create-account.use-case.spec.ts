import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CreateAccountUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/create-account.use-case';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../../../../../src/core/transfer-bank/domain/ports/account-repository.port';

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;
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
      providers: [CreateAccountUseCase, { provide: ACCOUNT_REPOSITORY, useValue: accountRepository }],
    }).compile();
    useCase = module.get(CreateAccountUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should create an account for an existing user', async () => {
    const dto = { userEmail: 'user@example.com', accountNumber: 'ACC-001', initialBalance: 125 };
    const user = { id: 'user-1', email: dto.userEmail, name: 'Account Owner' };
    const createdAccount = {
      id: 'account-1',
      accountNumber: dto.accountNumber,
      balance: 125,
      owner: { email: dto.userEmail, name: 'Account Owner' },
    };
    accountRepository.findUserByEmail.mockResolvedValue(user);
    accountRepository.findByNumber.mockResolvedValue(null);
    accountRepository.create.mockResolvedValue(createdAccount);

    const result = await useCase.execute(dto);

    expect(result).toEqual(createdAccount);
    expect(accountRepository.create).toHaveBeenCalledWith({
      accountNumber: 'ACC-001',
      balance: 125,
      userId: 'user-1',
    });
  });

  it('should create an account with a zero balance when no initial balance is supplied', async () => {
    accountRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1', email: 'user@example.com', name: 'Account Owner',
    });
    accountRepository.findByNumber.mockResolvedValue(null);
    accountRepository.create.mockResolvedValue({
      id: 'account-1',
      accountNumber: 'ACC-001',
      balance: 0,
      owner: { email: 'user@example.com', name: 'Account Owner' },
    });

    await useCase.execute({ userEmail: 'user@example.com', accountNumber: 'ACC-001' });

    expect(accountRepository.create).toHaveBeenCalledWith({
      accountNumber: 'ACC-001',
      balance: 0,
      userId: 'user-1',
    });
  });

  it('should throw when the user does not exist', async () => {
    accountRepository.findUserByEmail.mockResolvedValue(null);

    await expect(useCase.execute({
      userEmail: 'missing@example.com',
      accountNumber: 'ACC-001',
    })).rejects.toThrow(NotFoundException);
    expect(accountRepository.findByNumber).not.toHaveBeenCalled();
    expect(accountRepository.create).not.toHaveBeenCalled();
  });

  it('should reject an account number that is already in use', async () => {
    accountRepository.findUserByEmail.mockResolvedValue({
      id: 'user-1', email: 'user@example.com', name: 'Account Owner',
    });
    accountRepository.findByNumber.mockResolvedValue({
      id: 'account-existing',
      accountNumber: 'ACC-001',
      balance: 0,
      status: 'ACTIVE',
      userId: 'user-1',
      updatedAt: new Date(),
    });

    await expect(useCase.execute({
      userEmail: 'user@example.com',
      accountNumber: 'ACC-001',
    })).rejects.toThrow(ConflictException);
    expect(accountRepository.create).not.toHaveBeenCalled();
  });
});
