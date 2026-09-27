import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { Transaction, TransactionStatus } from '../../../../../src/core/transfer-bank/domain/entities/transaction.entity';
import { Money } from '../../../../../src/core/transfer-bank/domain/value-objects/money.vo';
import { PrismaService } from '../../../../../src/infrastructure/adapters/prisma/prisma.service';
import { PrismaTransactionRepository } from '../../../../../src/infrastructure/adapters/prisma/transaction.repository.prisma';

describe('PrismaTransactionRepository', () => {
  let repository: PrismaTransactionRepository;
  let prisma: any;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    prisma = {
      account: { findUnique: jest.fn(), update: jest.fn() },
      transaction: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaTransactionRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(PrismaTransactionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve account identifiers and save a mapped transaction', async () => {
    // Arrange
    const createdAt = new Date('2026-02-01T10:00:00.000Z');
    const completedAt = new Date('2026-02-01T10:01:00.000Z');
    const transaction = new Transaction({
      id: 'tx-1',
      fromAccount: 'source-number',
      toAccount: 'target-number',
      amount: new Money(12.5),
      status: TransactionStatus.COMPLETED,
      reference: 'ref-1',
      createdAt,
      completedAt,
    });
    prisma.account.findUnique
      .mockResolvedValueOnce({ id: 'source-id' })
      .mockResolvedValueOnce({ id: 'target-id' });
    prisma.transaction.create.mockResolvedValue({
      id: 'tx-1',
      amount: 12.5,
      status: 'COMPLETED',
      reference: 'ref-1',
      createdAt,
      completedAt,
    });

    // Act
    const result = await repository.save(transaction);

    // Assert
    expect(prisma.transaction.create).toHaveBeenCalledWith({
      data: {
        id: 'tx-1',
        fromAccountId: 'source-id',
        toAccountId: 'target-id',
        amount: 12.5,
        status: 'COMPLETED',
        reference: 'ref-1',
        attempts: 0,
        createdAt,
        completedAt,
      },
    });
    expect(result.toJSON()).toEqual(transaction.toJSON());
  });

  it('should normalize nullable reference and completion fields when saving', async () => {
    const createdAt = new Date('2026-02-01T10:00:00.000Z');
    const transaction = new Transaction({
      id: 'tx-no-optional-fields',
      fromAccount: 'source-number',
      toAccount: 'target-number',
      amount: new Money(8),
      createdAt,
    });
    prisma.account.findUnique
      .mockResolvedValueOnce({ id: 'source-id' })
      .mockResolvedValueOnce({ id: 'target-id' });
    prisma.transaction.create.mockResolvedValue({
      id: transaction.id,
      amount: 8,
      status: 'PENDING',
      reference: null,
      createdAt,
      completedAt: null,
    });

    const result = await repository.save(transaction);
    expect(result.toJSON()).toEqual({
      id: 'tx-no-optional-fields',
      fromAccount: 'source-number',
      toAccount: 'target-number',
      amount: 8,
      status: 'PENDING',
      reference: undefined,
      createdAt,
      completedAt: undefined,
    });
  });

  it('should reject saving when the source account is missing', async () => {
    // Arrange
    const transaction = new Transaction({
      fromAccount: 'missing-source',
      toAccount: 'target-number',
      amount: new Money(5),
    });
    prisma.account.findUnique.mockResolvedValueOnce(null);

    // Act & Assert
    await expect(repository.save(transaction)).rejects.toThrow(
      'Cuenta origen missing-source no encontrada',
    );
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it('should reject saving when the destination account is missing', async () => {
    const transaction = new Transaction({
      fromAccount: 'source-number',
      toAccount: 'missing-target',
      amount: new Money(5),
    });
    prisma.account.findUnique
      .mockResolvedValueOnce({ id: 'source-id' })
      .mockResolvedValueOnce(null);

    await expect(repository.save(transaction)).rejects.toThrow(
      'Cuenta destino missing-target no encontrada',
    );
    expect(prisma.transaction.create).not.toHaveBeenCalled();
  });

  it('should return null when a transaction is not found', async () => {
    // Arrange
    prisma.transaction.findUnique.mockResolvedValue(null);

    // Act
    const result = await repository.findById('missing');

    // Assert
    expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
      where: { id: 'missing' },
      include: { fromAccount: true, toAccount: true },
    });
    expect(result).toBeNull();
  });

  it('should map a found transaction and normalize nullable fields', async () => {
    const createdAt = new Date('2026-02-01T10:00:00.000Z');
    prisma.transaction.findUnique.mockResolvedValue({
      id: 'tx-1',
      amount: 12.5,
      status: 'FAILED',
      reference: null,
      createdAt,
      completedAt: null,
      fromAccount: { accountNumber: '1001' },
      toAccount: { accountNumber: '1002' },
    });

    const result = await repository.findById('tx-1');
    expect(result?.toJSON()).toEqual({
      id: 'tx-1',
      fromAccount: '1001',
      toAccount: '1002',
      amount: 12.5,
      status: 'FAILED',
      reference: undefined,
      createdAt,
      completedAt: undefined,
    });
  });

  it('should update status and map the returned transaction', async () => {
    const createdAt = new Date('2026-02-01T10:00:00.000Z');
    const completedAt = new Date('2026-02-01T10:05:00.000Z');
    prisma.transaction.update.mockResolvedValue({
      id: 'tx-1',
      amount: 12.5,
      status: 'COMPLETED',
      reference: 'ref-1',
      createdAt,
      completedAt,
      fromAccount: { accountNumber: '1001' },
      toAccount: { accountNumber: '1002' },
    });

    const result = await repository.updateStatus('tx-1', 'COMPLETED');
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
      data: { status: 'COMPLETED' },
      include: { fromAccount: true, toAccount: true },
    });
    expect(result.toJSON()).toEqual({
      id: 'tx-1',
      fromAccount: '1001',
      toAccount: '1002',
      amount: 12.5,
      status: 'COMPLETED',
      reference: 'ref-1',
      createdAt,
      completedAt,
    });
  });

  it('should normalize nullable fields when mapping an updated transaction', async () => {
    const createdAt = new Date('2026-02-01T10:00:00.000Z');
    prisma.transaction.update.mockResolvedValue({
      id: 'tx-1',
      amount: 12.5,
      status: 'FAILED',
      reference: null,
      createdAt,
      completedAt: null,
      fromAccount: { accountNumber: '1001' },
      toAccount: { accountNumber: '1002' },
    });

    const result = await repository.updateStatus('tx-1', 'FAILED');
    expect(result.toJSON()).toEqual({
      id: 'tx-1',
      fromAccount: '1001',
      toAccount: '1002',
      amount: 12.5,
      status: 'FAILED',
      reference: undefined,
      createdAt,
      completedAt: undefined,
    });
  });

  it('should list transfers newest first with account numbers', async () => {
    const createdAt = new Date('2026-02-01T10:00:00.000Z');
    const completedAt = new Date('2026-02-01T10:05:00.000Z');
    prisma.transaction.findMany.mockResolvedValue([{
      id: 'tx-1',
      amount: 12.5,
      status: 'COMPLETED',
      reference: 'ref-1',
      createdAt,
      completedAt,
      fromAccount: { accountNumber: '1001' },
      toAccount: { accountNumber: '1002' },
    }]);

    await expect(repository.findAll()).resolves.toEqual([{
      id: 'tx-1',
      fromAccount: '1001',
      toAccount: '1002',
      amount: 12.5,
      status: 'COMPLETED',
      reference: 'ref-1',
      createdAt,
      completedAt,
    }]);
    expect(prisma.transaction.findMany).toHaveBeenCalledWith({
      include: {
        fromAccount: { select: { accountNumber: true } },
        toAccount: { select: { accountNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should debit and credit accounts before completing the transfer', async () => {
    const tx = {
      account: { update: jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined) },
      transaction: { update: jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined) },
    };
    prisma.$transaction.mockImplementation(async (callback: (transaction: any) => Promise<void>) => callback(tx));

    await repository.completeTransfer('tx-1', 'source-id', 'target-id', 15);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.account.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'source-id' },
      data: { balance: { decrement: 15 } },
    });
    expect(tx.account.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'target-id' },
      data: { balance: { increment: 15 } },
    });
    expect(tx.transaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
      data: { status: 'COMPLETED', completedAt: expect.any(Date) },
    });
  });

  it('should mark a transfer as failed and increment attempts', async () => {
    await repository.markAsFailed('tx-1');
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
      data: { status: 'FAILED', attempts: { increment: 1 } },
    });
  });
});
