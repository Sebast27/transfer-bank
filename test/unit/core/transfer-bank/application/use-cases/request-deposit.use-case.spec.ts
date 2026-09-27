import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RequestDepositUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/request-deposit.use-case';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../../../../../src/core/transfer-bank/domain/ports/account-repository.port';
import { DEPOSIT_REPOSITORY, IDepositRepository } from '../../../../../../src/core/transfer-bank/domain/ports/deposit-repository.port';

describe('RequestDepositUseCase', () => {
  let useCase: RequestDepositUseCase;
  let module: TestingModule;
  let accountRepository: jest.Mocked<IAccountRepository>;
  let depositRepository: jest.Mocked<IDepositRepository>;
  const account = {
    id: 'account-1',
    accountNumber: 'ACC-001',
    balance: 100,
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
    depositRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findPending: jest.fn(),
      completeDeposit: jest.fn(),
    };
    module = await Test.createTestingModule({
      providers: [
        RequestDepositUseCase,
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepository },
        { provide: DEPOSIT_REPOSITORY, useValue: depositRepository },
      ],
    }).compile();
    useCase = module.get(RequestDepositUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should create a pending deposit for the account owner', async () => {
    accountRepository.findByNumber.mockResolvedValue(account);
    depositRepository.create.mockResolvedValue({ id: 'deposit-1', status: 'PENDING', amount: 60 });

    const result = await useCase.execute({
      accountNumber: 'ACC-001', amount: 60, reference: 'Cash deposit',
    }, 'user-1');

    expect(result).toEqual({
      depositId: 'deposit-1', status: 'PENDING', accountNumber: 'ACC-001', amount: 60,
    });
    expect(depositRepository.create).toHaveBeenCalledWith({
      accountId: 'account-1',
      amount: 60,
      requestedBy: 'user-1',
      reference: 'Cash deposit',
    });
  });

  it('should throw when the account does not exist', async () => {
    accountRepository.findByNumber.mockResolvedValue(null);

    await expect(useCase.execute({ accountNumber: 'missing', amount: 60 }, 'user-1'))
      .rejects.toThrow(NotFoundException);
    expect(depositRepository.create).not.toHaveBeenCalled();
  });

  it('should reject deposits to an account that is not active', async () => {
    accountRepository.findByNumber.mockResolvedValue({ ...account, status: 'FROZEN' });

    await expect(useCase.execute({ accountNumber: 'ACC-001', amount: 60 }, 'user-1'))
      .rejects.toThrow(BadRequestException);
    expect(depositRepository.create).not.toHaveBeenCalled();
  });

  it('should reject a request from someone other than the account owner', async () => {
    accountRepository.findByNumber.mockResolvedValue(account);

    await expect(useCase.execute({ accountNumber: 'ACC-001', amount: 60 }, 'user-2'))
      .rejects.toThrow(NotFoundException);
    expect(depositRepository.create).not.toHaveBeenCalled();
  });
});
