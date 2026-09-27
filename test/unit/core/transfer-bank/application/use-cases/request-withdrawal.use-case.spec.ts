import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RequestWithdrawalUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/request-withdrawal.use-case';
import { IQueuePort, QUEUE_PORT } from '../../../../../../src/core/transfer-bank/application/ports/queue.port';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../../../../../src/core/transfer-bank/domain/ports/account-repository.port';
import { IWithdrawalRepository, WITHDRAWAL_REPOSITORY } from '../../../../../../src/core/transfer-bank/domain/ports/withdrawal-repository.port';

describe('RequestWithdrawalUseCase', () => {
  let useCase: RequestWithdrawalUseCase;
  let module: TestingModule;
  let accountRepository: jest.Mocked<IAccountRepository>;
  let withdrawalRepository: jest.Mocked<IWithdrawalRepository>;
  let queuePort: jest.Mocked<IQueuePort>;
  const account = {
    id: 'account-1',
    accountNumber: 'ACC-001',
    balance: 200,
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
    withdrawalRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithAccount: jest.fn(),
      updateStatus: jest.fn(),
      completeWithdrawal: jest.fn(),
      markAsFailed: jest.fn(),
    };
    queuePort = { add: jest.fn() };
    module = await Test.createTestingModule({
      providers: [
        RequestWithdrawalUseCase,
        { provide: WITHDRAWAL_REPOSITORY, useValue: withdrawalRepository },
        { provide: QUEUE_PORT, useValue: queuePort },
        { provide: ACCOUNT_REPOSITORY, useValue: accountRepository },
      ],
    }).compile();
    useCase = module.get(RequestWithdrawalUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should create and enqueue a withdrawal for the account owner', async () => {
    accountRepository.findByNumber.mockResolvedValue(account);
    withdrawalRepository.create.mockResolvedValue({
      id: 'withdrawal-1',
      status: 'PENDING',
      amount: 75,
    });
    queuePort.add.mockResolvedValue(undefined);

    const result = await useCase.execute({
      accountNumber: 'ACC-001',
      amount: 75,
      reference: 'Cash withdrawal',
    }, 'user-1');

    expect(result).toEqual({
      withdrawalId: 'withdrawal-1',
      status: 'PENDING',
      accountNumber: 'ACC-001',
      amount: 75,
    });
    expect(withdrawalRepository.create).toHaveBeenCalledWith({
      accountId: 'account-1',
      amount: 75,
      reference: 'Cash withdrawal',
    });
    expect(queuePort.add).toHaveBeenCalledWith('withdrawal-queue', {
      withdrawalId: 'withdrawal-1',
      accountId: 'account-1',
      amount: 75,
    });
  });

  it('should throw when the account does not exist', async () => {
    accountRepository.findByNumber.mockResolvedValue(null);

    await expect(useCase.execute({ accountNumber: 'missing', amount: 75 }, 'user-1'))
      .rejects.toThrow(NotFoundException);
    expect(withdrawalRepository.create).not.toHaveBeenCalled();
  });

  it('should reject a withdrawal from an inactive account', async () => {
    accountRepository.findByNumber.mockResolvedValue({ ...account, status: 'FROZEN' });

    await expect(useCase.execute({ accountNumber: 'ACC-001', amount: 75 }, 'user-1'))
      .rejects.toThrow(BadRequestException);
    expect(withdrawalRepository.create).not.toHaveBeenCalled();
  });

  it('should reject a withdrawal requested by someone other than the account owner', async () => {
    accountRepository.findByNumber.mockResolvedValue(account);

    await expect(useCase.execute({ accountNumber: 'ACC-001', amount: 75 }, 'user-2'))
      .rejects.toThrow(NotFoundException);
    expect(withdrawalRepository.create).not.toHaveBeenCalled();
  });

  it('should reject a withdrawal larger than the available balance', async () => {
    accountRepository.findByNumber.mockResolvedValue(account);

    await expect(useCase.execute({ accountNumber: 'ACC-001', amount: 201 }, 'user-1'))
      .rejects.toThrow(BadRequestException);
    expect(withdrawalRepository.create).not.toHaveBeenCalled();
  });
});
