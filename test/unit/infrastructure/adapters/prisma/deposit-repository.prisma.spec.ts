import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/infrastructure/adapters/prisma/prisma.service';
import { PrismaDepositRepository } from '../../../../../src/infrastructure/adapters/prisma/deposit-repository.prisma';

describe('PrismaDepositRepository', () => {
  let repository: PrismaDepositRepository;
  let prisma: any;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    prisma = {
      deposit: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaDepositRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(PrismaDepositRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a pending deposit and return its summary', async () => {
    // Arrange
    prisma.deposit.create.mockResolvedValue({
      id: 'deposit-id',
      status: 'PENDING',
      amount: 75,
    });

    // Act
    const result = await repository.create({
      accountId: 'account-id',
      amount: 75,
      requestedBy: 'user-id',
      reference: 'ref-1',
    });

    // Assert
    expect(prisma.deposit.create).toHaveBeenCalledWith({
      data: {
        accountId: 'account-id',
        amount: 75,
        status: 'PENDING',
        requestedBy: 'user-id',
        reference: 'ref-1',
      },
    });
    expect(result).toEqual({ id: 'deposit-id', status: 'PENDING', amount: 75 });
  });

  it('should map a deposit and its account and owner', async () => {
    // Arrange
    const createdAt = new Date('2026-05-01T10:00:00.000Z');
    prisma.deposit.findUnique.mockResolvedValue({
      id: 'deposit-id',
      accountId: 'account-id',
      amount: 75,
      status: 'COMPLETED',
      requestedBy: 'user-id',
      approvedBy: 'admin-id',
      reference: 'ref-1',
      createdAt,
      approvedAt: null,
      completedAt: createdAt,
      account: {
        id: 'account-id',
        accountNumber: '1001',
        balance: 175,
        status: 'ACTIVE',
        user: { id: 'user-id', email: 'user@example.com', name: 'User' },
      },
    });

    // Act
    const result = await repository.findById('deposit-id');

    // Assert
    expect(result).toEqual({
      id: 'deposit-id',
      accountId: 'account-id',
      amount: 75,
      status: 'COMPLETED',
      requestedBy: 'user-id',
      approvedBy: 'admin-id',
      reference: 'ref-1',
      createdAt,
      approvedAt: null,
      completedAt: createdAt,
      account: {
        id: 'account-id',
        accountNumber: '1001',
        balance: 175,
        status: 'ACTIVE',
        user: { id: 'user-id', email: 'user@example.com', name: 'User' },
      },
    });
  });

  it('should complete a deposit within a transaction', async () => {
    // Arrange
    const tx = {
      account: { update: jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined) },
      deposit: { update: jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined) },
    };
    prisma.$transaction.mockImplementation(async (callback: (transaction: any) => Promise<void>) => callback(tx));

    // Act
    await repository.completeDeposit('deposit-id', 'account-id', 75);

    // Assert
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.account.update).toHaveBeenCalledWith({
      where: { id: 'account-id' },
      data: { balance: { increment: 75 } },
    });
    expect(tx.deposit.update).toHaveBeenCalledWith({
      where: { id: 'deposit-id' },
      data: { status: 'COMPLETED', completedAt: expect.any(Date) },
    });
  });

  it('should return null when the deposit does not exist', async () => {
    prisma.deposit.findUnique.mockResolvedValue(null);
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('should update a deposit status and set only the matching timestamp', async () => {
    await repository.updateStatus('deposit-id', 'APPROVED', 'admin-id');
    expect(prisma.deposit.update).toHaveBeenLastCalledWith({
      where: { id: 'deposit-id' },
      data: {
        status: 'APPROVED',
        approvedBy: 'admin-id',
        approvedAt: expect.any(Date),
        completedAt: undefined,
      },
    });

    await repository.updateStatus('deposit-id', 'COMPLETED');
    expect(prisma.deposit.update).toHaveBeenLastCalledWith({
      where: { id: 'deposit-id' },
      data: {
        status: 'COMPLETED',
        approvedBy: undefined,
        approvedAt: undefined,
        completedAt: expect.any(Date),
      },
    });

    await repository.updateStatus('deposit-id', 'REJECTED');
    expect(prisma.deposit.update).toHaveBeenLastCalledWith({
      where: { id: 'deposit-id' },
      data: {
        status: 'REJECTED',
        approvedBy: undefined,
        approvedAt: undefined,
        completedAt: undefined,
      },
    });
  });

  it('should fetch pending deposits with account numbers newest first', async () => {
    const deposits = [{ id: 'deposit-id', account: { accountNumber: '1001' } }];
    prisma.deposit.findMany.mockResolvedValue(deposits);

    await expect(repository.findPending()).resolves.toBe(deposits);
    expect(prisma.deposit.findMany).toHaveBeenCalledWith({
      where: { status: 'PENDING' },
      include: { account: { select: { accountNumber: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });
});
