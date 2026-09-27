import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UpdateAccountStatusUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/update-account-status.use-case';
import { AccountStatus } from '../../../../../../src/core/transfer-bank/application/dto/update-account-status.dto';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../../../../../src/core/transfer-bank/domain/ports/account-repository.port';

describe('UpdateAccountStatusUseCase', () => {
  let useCase: UpdateAccountStatusUseCase;
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
      providers: [UpdateAccountStatusUseCase, { provide: ACCOUNT_REPOSITORY, useValue: accountRepository }],
    }).compile();
    useCase = module.get(UpdateAccountStatusUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should update the account status and return the updated account summary', async () => {
    const updatedAt = new Date('2026-01-01T00:00:00.000Z');
    accountRepository.findByNumber.mockResolvedValue({
      id: 'account-1',
      accountNumber: 'ACC-001',
      balance: 100,
      status: 'ACTIVE',
      userId: 'user-1',
      updatedAt,
    });
    accountRepository.updateStatus.mockResolvedValue({
      accountNumber: 'ACC-001',
      status: 'FROZEN',
      updatedAt,
    });

    const result = await useCase.execute('ACC-001', { status: AccountStatus.FROZEN });

    expect(result).toEqual({ accountNumber: 'ACC-001', status: 'FROZEN', updatedAt });
    expect(accountRepository.findByNumber).toHaveBeenCalledWith('ACC-001');
    expect(accountRepository.updateStatus).toHaveBeenCalledWith('ACC-001', 'FROZEN');
  });

  it('should throw when the account does not exist', async () => {
    accountRepository.findByNumber.mockResolvedValue(null);

    await expect(useCase.execute('missing', { status: AccountStatus.CLOSED })).rejects.toThrow(NotFoundException);
    expect(accountRepository.updateStatus).not.toHaveBeenCalled();
  });
});
