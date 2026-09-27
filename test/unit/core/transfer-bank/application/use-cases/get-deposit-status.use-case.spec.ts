import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetDepositStatusUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/get-deposit-status.use-case';
import { DEPOSIT_REPOSITORY, IDepositRepository } from '../../../../../../src/core/transfer-bank/domain/ports/deposit-repository.port';

describe('GetDepositStatusUseCase', () => {
  let useCase: GetDepositStatusUseCase;
  let module: TestingModule;
  let depositRepository: jest.Mocked<IDepositRepository>;
  const deposit = {
    id: 'deposit-1',
    accountId: 'account-1',
    amount: 75,
    status: 'APPROVED',
    requestedBy: 'user-1',
    approvedBy: 'admin-1',
    reference: 'Cash deposit',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    approvedAt: new Date('2026-01-01T00:01:00.000Z'),
    completedAt: null,
    account: {
      id: 'account-1',
      accountNumber: 'ACC-001',
      balance: 75,
      status: 'ACTIVE',
      user: { id: 'user-1', email: 'user@example.com', name: 'User' },
    },
  };

  beforeEach(async () => {
    depositRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findPending: jest.fn(),
      completeDeposit: jest.fn(),
    };
    module = await Test.createTestingModule({
      providers: [GetDepositStatusUseCase, { provide: DEPOSIT_REPOSITORY, useValue: depositRepository }],
    }).compile();
    useCase = module.get(GetDepositStatusUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return the deposit status to its owner', async () => {
    depositRepository.findById.mockResolvedValue(deposit);

    const result = await useCase.execute('deposit-1', 'user-1', 'USER');

    expect(result).toEqual({
      id: deposit.id,
      accountId: deposit.accountId,
      amount: deposit.amount,
      status: deposit.status,
      requestedBy: deposit.requestedBy,
      approvedBy: deposit.approvedBy,
      reference: deposit.reference,
      createdAt: deposit.createdAt,
      approvedAt: deposit.approvedAt,
      completedAt: deposit.completedAt,
    });
    expect(depositRepository.findById).toHaveBeenCalledWith('deposit-1');
  });

  it('should allow an admin to view another user deposit', async () => {
    depositRepository.findById.mockResolvedValue(deposit);

    await expect(useCase.execute('deposit-1', 'admin-2', 'ADMIN')).resolves.toMatchObject({ id: 'deposit-1' });
  });

  it('should throw when the deposit does not exist', async () => {
    depositRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'user-1', 'USER')).rejects.toThrow(NotFoundException);
  });

  it('should forbid a user from viewing another users deposit', async () => {
    depositRepository.findById.mockResolvedValue(deposit);

    await expect(useCase.execute('deposit-1', 'user-2', 'USER')).rejects.toThrow(ForbiddenException);
  });
});
