import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ApproveDepositUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/approve-deposit.use-case';
import { DEPOSIT_REPOSITORY, IDepositRepository } from '../../../../../../src/core/transfer-bank/domain/ports/deposit-repository.port';
import { IQueuePort, QUEUE_PORT } from '../../../../../../src/core/transfer-bank/application/ports/queue.port';

describe('ApproveDepositUseCase', () => {
  let useCase: ApproveDepositUseCase;
  let module: TestingModule;
  let depositRepository: jest.Mocked<IDepositRepository>;
  let queuePort: jest.Mocked<IQueuePort>;
  const deposit = {
    id: 'deposit-1',
    accountId: 'account-1',
    amount: 80,
    status: 'PENDING',
    requestedBy: 'user-1',
    approvedBy: null,
    reference: 'Cash deposit',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    approvedAt: null,
    completedAt: null,
    account: {
      id: 'account-1',
      accountNumber: 'ACC-001',
      balance: 100,
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
    queuePort = { add: jest.fn() };
    module = await Test.createTestingModule({
      providers: [
        ApproveDepositUseCase,
        { provide: DEPOSIT_REPOSITORY, useValue: depositRepository },
        { provide: QUEUE_PORT, useValue: queuePort },
      ],
    }).compile();
    useCase = module.get(ApproveDepositUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should approve a pending deposit and enqueue it for processing', async () => {
    depositRepository.findById.mockResolvedValue(deposit);
    depositRepository.updateStatus.mockResolvedValue(undefined);
    queuePort.add.mockResolvedValue(undefined);

    const result = await useCase.execute('deposit-1', 'admin-1');

    expect(result).toEqual({ depositId: 'deposit-1', status: 'APPROVED' });
    expect(depositRepository.findById).toHaveBeenCalledWith('deposit-1');
    expect(depositRepository.updateStatus).toHaveBeenCalledWith('deposit-1', 'APPROVED', 'admin-1');
    expect(queuePort.add).toHaveBeenCalledWith('deposit-queue', {
      depositId: 'deposit-1',
      accountId: 'account-1',
      amount: 80,
    });
  });

  it('should throw when the deposit does not exist', async () => {
    depositRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'admin-1')).rejects.toThrow(NotFoundException);
    expect(depositRepository.updateStatus).not.toHaveBeenCalled();
    expect(queuePort.add).not.toHaveBeenCalled();
  });

  it('should reject a deposit that is not pending', async () => {
    depositRepository.findById.mockResolvedValue({ ...deposit, status: 'COMPLETED' });

    await expect(useCase.execute('deposit-1', 'admin-1')).rejects.toThrow(BadRequestException);
    expect(depositRepository.updateStatus).not.toHaveBeenCalled();
    expect(queuePort.add).not.toHaveBeenCalled();
  });
});
