import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/infrastructure/adapters/prisma/prisma.service';
import { PrismaTransactionHistoryRepository } from '../../../../../src/infrastructure/adapters/prisma/transaction-history-repository.prisma';

describe('PrismaTransactionHistoryRepository', () => {
  let repository: PrismaTransactionHistoryRepository;
  let prisma: any;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    prisma = {
      transaction: { findMany: jest.fn<() => Promise<any[]>>().mockResolvedValue([]) },
      deposit: { findMany: jest.fn<() => Promise<any[]>>().mockResolvedValue([]) },
      withdrawal: { findMany: jest.fn<() => Promise<any[]>>().mockResolvedValue([]) },
    };
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaTransactionHistoryRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(PrismaTransactionHistoryRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should map and sort all account activity while applying date filters', async () => {
    // Arrange
    const fromDate = new Date('2026-04-01T00:00:00.000Z');
    const toDate = new Date('2026-04-30T23:59:59.000Z');
    const newest = new Date('2026-04-20T12:00:00.000Z');
    const middle = new Date('2026-04-15T12:00:00.000Z');
    const oldest = new Date('2026-04-10T12:00:00.000Z');
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 'transfer-1',
        fromAccountId: 'account-1',
        toAccountId: 'account-2',
        amount: 30,
        status: 'COMPLETED',
        reference: 'transfer-ref',
        createdAt: middle,
        fromAccount: { accountNumber: '101' },
        toAccount: { accountNumber: '202' },
      },
    ]);
    prisma.deposit.findMany.mockResolvedValue([
      {
        id: 'deposit-1',
        amount: 50,
        status: 'COMPLETED',
        reference: 'deposit-ref',
        createdAt: newest,
      },
    ]);
    prisma.withdrawal.findMany.mockResolvedValue([
      {
        id: 'withdrawal-1',
        amount: 10,
        status: 'COMPLETED',
        reference: 'withdrawal-ref',
        createdAt: oldest,
      },
    ]);

    // Act
    const result = await repository.findByAccountId('account-1', {
      fromDate,
      toDate,
    });

    // Assert
    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      where: {
        OR: [{ fromAccountId: 'account-1' }, { toAccountId: 'account-1' }],
        createdAt: { gte: fromDate, lte: toDate },
      },
      include: {
        fromAccount: { select: { accountNumber: true } },
        toAccount: { select: { accountNumber: true } },
      },
    });
    expect(prisma.deposit.findMany).toHaveBeenCalledWith({
      where: { accountId: 'account-1', createdAt: { gte: fromDate, lte: toDate } },
    });
    expect(result).toEqual([
      {
        id: 'deposit-1',
        type: 'DEPOSIT',
        amount: 50,
        direction: 'CREDIT',
        status: 'COMPLETED',
        reference: 'deposit-ref',
        date: newest,
      },
      {
        id: 'transfer-1',
        type: 'TRANSFER',
        amount: 30,
        direction: 'DEBIT',
        status: 'COMPLETED',
        reference: 'transfer-ref',
        date: middle,
        counterparty: '202',
      },
      {
        id: 'withdrawal-1',
        type: 'WITHDRAWAL',
        amount: 10,
        direction: 'DEBIT',
        status: 'COMPLETED',
        reference: 'withdrawal-ref',
        date: oldest,
      },
    ]);
  });

  it('should query only the requested activity type', async () => {
    // Arrange

    // Act
    const result = await repository.findByAccountId('account-1', { type: 'DEPOSIT' });

    // Assert
    expect(prisma.transaction.findMany).not.toHaveBeenCalled();
    expect(prisma.withdrawal.findMany).not.toHaveBeenCalled();
    expect(prisma.deposit.findMany).toHaveBeenCalledWith({
      where: { accountId: 'account-1' },
    });
    expect(result).toEqual([]);
  });

  it('should map transfer credits and apply a single upper date bound', async () => {
    // Arrange
    const toDate = new Date('2026-05-31T23:59:59.000Z');
    const transferDate = new Date('2026-05-20T12:00:00.000Z');
    prisma.transaction.findMany.mockResolvedValue([
      {
        id: 'transfer-credit',
        fromAccountId: 'other-account',
        toAccountId: 'account-1',
        amount: 45,
        status: 'COMPLETED',
        reference: 'incoming-transfer',
        createdAt: transferDate,
        fromAccount: { accountNumber: '101' },
        toAccount: { accountNumber: '202' },
      },
    ]);

    // Act
    const result = await repository.findByAccountId('account-1', {
      type: 'TRANSFER',
      toDate,
    });

    // Assert
    expect(prisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ fromAccountId: 'account-1' }, { toAccountId: 'account-1' }],
          createdAt: { lte: toDate },
        },
      }),
    );
    expect(prisma.deposit.findMany).not.toHaveBeenCalled();
    expect(prisma.withdrawal.findMany).not.toHaveBeenCalled();
    expect(result).toEqual([
      {
        id: 'transfer-credit',
        type: 'TRANSFER',
        amount: 45,
        direction: 'CREDIT',
        status: 'COMPLETED',
        reference: 'incoming-transfer',
        date: transferDate,
        counterparty: '101',
      },
    ]);
  });

  it('should apply only the lower date bound to deposit activity', async () => {
    // Arrange
    const fromDate = new Date('2026-05-01T00:00:00.000Z');

    // Act
    await repository.findByAccountId('account-1', {
      type: 'DEPOSIT',
      fromDate,
    });

    // Assert
    expect(prisma.deposit.findMany).toHaveBeenCalledWith({
      where: { accountId: 'account-1', createdAt: { gte: fromDate } },
    });
  });
});
