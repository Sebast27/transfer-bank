import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetWithdrawalStatusUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/get-withdrawal-status.use-case';
import { IWithdrawalRepository, WITHDRAWAL_REPOSITORY } from '../../../../../../src/core/transfer-bank/domain/ports/withdrawal-repository.port';

describe('GetWithdrawalStatusUseCase', () => {
  let useCase: GetWithdrawalStatusUseCase;
  let module: TestingModule;
  let withdrawalRepository: jest.Mocked<IWithdrawalRepository>;
  const withdrawal = {
    id: 'withdrawal-1',
    accountId: 'account-1',
    amount: 30,
    status: 'COMPLETED',
    reference: 'Cash withdrawal',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    completedAt: new Date('2026-01-01T00:01:00.000Z'),
    accountUserId: 'user-1',
  };

  beforeEach(async () => {
    withdrawalRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithAccount: jest.fn(),
      updateStatus: jest.fn(),
      completeWithdrawal: jest.fn(),
      markAsFailed: jest.fn(),
    };
    module = await Test.createTestingModule({
      providers: [GetWithdrawalStatusUseCase, { provide: WITHDRAWAL_REPOSITORY, useValue: withdrawalRepository }],
    }).compile();
    useCase = module.get(GetWithdrawalStatusUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return the withdrawal status to its account owner', async () => {
    withdrawalRepository.findById.mockResolvedValue(withdrawal);

    const result = await useCase.execute('withdrawal-1', 'user-1', 'USER');

    expect(result).toEqual({
      id: withdrawal.id,
      accountId: withdrawal.accountId,
      amount: withdrawal.amount,
      status: withdrawal.status,
      reference: withdrawal.reference,
      createdAt: withdrawal.createdAt,
      completedAt: withdrawal.completedAt,
    });
  });

  it('should allow an admin to view another users withdrawal', async () => {
    withdrawalRepository.findById.mockResolvedValue(withdrawal);

    await expect(useCase.execute('withdrawal-1', 'admin-1', 'ADMIN')).resolves.toMatchObject({ id: 'withdrawal-1' });
  });

  it('should throw when the withdrawal does not exist', async () => {
    withdrawalRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'user-1', 'USER')).rejects.toThrow(NotFoundException);
  });

  it('should forbid a user from viewing another users withdrawal', async () => {
    withdrawalRepository.findById.mockResolvedValue(withdrawal);

    await expect(useCase.execute('withdrawal-1', 'user-2', 'USER')).rejects.toThrow(ForbiddenException);
  });
});
