import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/infrastructure/adapters/prisma/prisma.service';
import { PrismaStatementRepository } from '../../../../../src/infrastructure/adapters/prisma/statement-repository.prisma';

describe('PrismaStatementRepository', () => {
  let repository: PrismaStatementRepository;
  let prisma: any;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    prisma = {
      account: { findUnique: jest.fn() },
      statement: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaStatementRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(PrismaStatementRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a pending statement using the account identifier', async () => {
    // Arrange
    const periodStart = new Date('2026-01-01T00:00:00.000Z');
    const periodEnd = new Date('2026-01-31T23:59:59.000Z');
    prisma.account.findUnique.mockResolvedValue({ id: 'account-id' });
    prisma.statement.create.mockResolvedValue({ id: 'statement-id', status: 'PENDING' });

    // Act
    const result = await repository.create({
      accountId: '1001',
      periodStart,
      periodEnd,
    });

    // Assert
    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: { accountNumber: '1001' },
    });
    expect(prisma.statement.create).toHaveBeenCalledWith({
      data: {
        accountId: 'account-id',
        periodStart,
        periodEnd,
        status: 'PENDING',
      },
    });
    expect(result).toEqual({ id: 'statement-id', status: 'PENDING' });
  });

  it('should reject statement creation when the account is missing', async () => {
    // Arrange
    prisma.account.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(repository.create({
      accountId: 'missing',
      periodStart: new Date('2026-01-01T00:00:00.000Z'),
      periodEnd: new Date('2026-01-31T23:59:59.000Z'),
    })).rejects.toThrow('Account missing not found');
    expect(prisma.statement.create).not.toHaveBeenCalled();
  });

  it('should map statement details with its associated account', async () => {
    // Arrange
    const periodStart = new Date('2026-01-01T00:00:00.000Z');
    const periodEnd = new Date('2026-01-31T23:59:59.000Z');
    const createdAt = new Date('2026-02-01T00:00:00.000Z');
    prisma.statement.findUnique.mockResolvedValue({
      id: 'statement-id',
      accountId: 'account-id',
      periodStart,
      periodEnd,
      status: 'COMPLETED',
      filePath: 'statements/file.pdf',
      error: null,
      createdAt,
      completedAt: null,
      account: { accountNumber: '1001', userId: 'user-id' },
    });

    // Act
    const result = await repository.findById('statement-id');

    // Assert
    expect(result).toEqual({
      id: 'statement-id',
      accountId: 'account-id',
      accountNumber: '1001',
      accountUserId: 'user-id',
      periodStart,
      periodEnd,
      status: 'COMPLETED',
      filePath: 'statements/file.pdf',
      error: null,
      createdAt,
      completedAt: null,
    });
  });

  it('should return null when a statement does not exist', async () => {
    // Arrange
    prisma.statement.findUnique.mockResolvedValue(null);

    // Act
    const result = await repository.findById('missing');

    // Assert
    expect(result).toBeNull();
  });

  it('should return statement, account, user, and combined transaction details', async () => {
    const createdAt = new Date('2026-02-01T00:00:00.000Z');
    const fromTransaction = {
      id: 'from-tx',
      fromAccountId: 'account-id',
      toAccountId: 'other-id',
      amount: 10,
      status: 'COMPLETED',
      reference: 'outgoing',
      createdAt,
      ignored: true,
    };
    const toTransaction = {
      id: 'to-tx',
      fromAccountId: 'other-id',
      toAccountId: 'account-id',
      amount: 20,
      status: 'COMPLETED',
      reference: 'incoming',
      createdAt,
    };
    prisma.statement.findUnique.mockResolvedValue({
      id: 'statement-id',
      accountId: 'account-id',
      periodStart: createdAt,
      periodEnd: createdAt,
      status: 'COMPLETED',
      filePath: 'statement.pdf',
      account: {
        id: 'account-id',
        accountNumber: '1001',
        balance: 100,
        status: 'ACTIVE',
        user: { id: 'user-id', email: 'user@example.com', name: 'User', password: 'hidden' },
        fromTransactions: [fromTransaction],
        toTransactions: [toTransaction],
      },
    });

    await expect(repository.findByIdWithAccount('statement-id')).resolves.toEqual({
      id: 'statement-id',
      accountId: 'account-id',
      periodStart: createdAt,
      periodEnd: createdAt,
      status: 'COMPLETED',
      filePath: 'statement.pdf',
      account: {
        id: 'account-id',
        accountNumber: '1001',
        balance: 100,
        status: 'ACTIVE',
        user: { id: 'user-id', email: 'user@example.com', name: 'User' },
        transactions: [
          {
            id: 'from-tx',
            fromAccountId: 'account-id',
            toAccountId: 'other-id',
            amount: 10,
            status: 'COMPLETED',
            reference: 'outgoing',
            createdAt,
          },
          {
            id: 'to-tx',
            fromAccountId: 'other-id',
            toAccountId: 'account-id',
            amount: 20,
            status: 'COMPLETED',
            reference: 'incoming',
            createdAt,
          },
        ],
      },
    });
    expect(prisma.statement.findUnique).toHaveBeenCalledWith({
      where: { id: 'statement-id' },
      include: {
        account: {
          include: { user: true, fromTransactions: true, toTransactions: true },
        },
      },
    });
  });

  it('should return null when a statement with account details is missing', async () => {
    prisma.statement.findUnique.mockResolvedValue(null);
    await expect(repository.findByIdWithAccount('missing')).resolves.toBeNull();
  });

  it('should update statement status', async () => {
    await repository.updateStatus('statement-id', 'PROCESSING');
    expect(prisma.statement.update).toHaveBeenCalledWith({
      where: { id: 'statement-id' },
      data: { status: 'PROCESSING' },
    });
  });

  it('should complete a statement with a completion timestamp', async () => {
    await repository.completeStatement('statement-id', 'statements/file.pdf');
    expect(prisma.statement.update).toHaveBeenCalledWith({
      where: { id: 'statement-id' },
      data: {
        status: 'COMPLETED',
        filePath: 'statements/file.pdf',
        completedAt: expect.any(Date),
      },
    });
  });

  it('should mark a statement as failed with its error message', async () => {
    await repository.markAsFailed('statement-id', 'render failed');
    expect(prisma.statement.update).toHaveBeenCalledWith({
      where: { id: 'statement-id' },
      data: { status: 'FAILED', error: 'render failed' },
    });
  });
});
