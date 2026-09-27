import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/infrastructure/adapters/prisma/prisma.service';
import { PrismaWithdrawalRepository } from '../../../../../src/infrastructure/adapters/prisma/withdrawal-repository.prisma';

describe('PrismaWithdrawalRepository', () => {
  let repository: PrismaWithdrawalRepository;
  let prisma: any;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    prisma = {
      withdrawal: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaWithdrawalRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(PrismaWithdrawalRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a pending withdrawal and return its summary', async () => {
    // Arrange
    prisma.withdrawal.create.mockResolvedValue({
      id: 'withdrawal-id',
      status: 'PENDING',
      amount: 25,
    });

    // Act
    const result = await repository.create({
      accountId: 'account-id',
      amount: 25,
      reference: 'ref-2',
    });

    // Assert
    expect(prisma.withdrawal.create).toHaveBeenCalledWith({
      data: {
        accountId: 'account-id',
        amount: 25,
        status: 'PENDING',
        reference: 'ref-2',
      },
    });
    expect(result).toEqual({ id: 'withdrawal-id', status: 'PENDING', amount: 25 });
  });

  it('should map withdrawal details and the account owner identifier', async () => {
    // Arrange
    const createdAt = new Date('2026-06-01T10:00:00.000Z');
    prisma.withdrawal.findUnique.mockResolvedValue({
      id: 'withdrawal-id',
      accountId: 'account-id',
      amount: 25,
      status: 'PENDING',
      reference: 'ref-2',
      createdAt,
      completedAt: null,
      account: { userId: 'user-id' },
    });

    // Act
    const result = await repository.findById('withdrawal-id');

    // Assert
    expect(result).toEqual({
      id: 'withdrawal-id',
      accountId: 'account-id',
      amount: 25,
      status: 'PENDING',
      reference: 'ref-2',
      createdAt,
      completedAt: null,
      accountUserId: 'user-id',
    });
  });

  it('should return null when a withdrawal does not exist', async () => {
    // Arrange
    prisma.withdrawal.findUnique.mockResolvedValue(null);

    // Act
    const result = await repository.findById('missing');

    // Assert
    expect(result).toBeNull();
  });

  it('should debit the account and complete the withdrawal transactionally', async () => {
    // Arrange
    const tx = {
      account: { update: jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined) },
      withdrawal: { update: jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined) },
    };
    prisma.$transaction.mockImplementation(async (callback: (transaction: any) => Promise<void>) => callback(tx));

    // Act
    await repository.completeWithdrawal('withdrawal-id', 'account-id', 25);

    // Assert
    expect(tx.account.update).toHaveBeenCalledWith({
      where: { id: 'account-id' },
      data: { balance: { decrement: 25 } },
    });
    expect(tx.withdrawal.update).toHaveBeenCalledWith({
      where: { id: 'withdrawal-id' },
      data: { status: 'COMPLETED', completedAt: expect.any(Date) },
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should return null when withdrawal details are missing', async () => {
    prisma.withdrawal.findUnique.mockResolvedValue(null);
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('should map withdrawal details with the complete account and owner', async () => {
    const createdAt = new Date('2026-06-01T10:00:00.000Z');
    prisma.withdrawal.findUnique.mockResolvedValue({
      id: 'withdrawal-id',
      accountId: 'account-id',
      amount: 25,
      status: 'PENDING',
      reference: 'ref-2',
      createdAt,
      completedAt: null,
      account: {
        id: 'account-id',
        accountNumber: '1001',
        balance: 75,
        status: 'ACTIVE',
        user: { id: 'user-id', email: 'user@example.com', name: 'User' },
      },
    });

    await expect(repository.findByIdWithAccount('withdrawal-id')).resolves.toEqual({
      id: 'withdrawal-id',
      accountId: 'account-id',
      amount: 25,
      status: 'PENDING',
      reference: 'ref-2',
      createdAt,
      completedAt: null,
      account: {
        id: 'account-id',
        accountNumber: '1001',
        balance: 75,
        status: 'ACTIVE',
        user: { id: 'user-id', email: 'user@example.com', name: 'User' },
      },
    });
    expect(prisma.withdrawal.findUnique).toHaveBeenCalledWith({
      where: { id: 'withdrawal-id' },
      include: { account: { include: { user: true } } },
    });
  });

  it('should return null when a withdrawal with account details is missing', async () => {
    prisma.withdrawal.findUnique.mockResolvedValue(null);
    await expect(repository.findByIdWithAccount('missing')).resolves.toBeNull();
  });

  it('should update status and set completion time only when completed', async () => {
    await repository.updateStatus('withdrawal-id', 'PROCESSING');
    expect(prisma.withdrawal.update).toHaveBeenLastCalledWith({
      where: { id: 'withdrawal-id' },
      data: { status: 'PROCESSING', completedAt: undefined },
    });

    await repository.updateStatus('withdrawal-id', 'COMPLETED');
    expect(prisma.withdrawal.update).toHaveBeenLastCalledWith({
      where: { id: 'withdrawal-id' },
      data: { status: 'COMPLETED', completedAt: expect.any(Date) },
    });
  });

  it('should mark a withdrawal as failed', async () => {
    await repository.markAsFailed('withdrawal-id');
    expect(prisma.withdrawal.update).toHaveBeenCalledWith({
      where: { id: 'withdrawal-id' },
      data: { status: 'FAILED' },
    });
  });
});
