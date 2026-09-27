import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaAccountRepository } from '../../../../../src/infrastructure/adapters/prisma/account-repository.prisma';
import { PrismaService } from '../../../../../src/infrastructure/adapters/prisma/prisma.service';

describe('PrismaAccountRepository', () => {
  let repository: PrismaAccountRepository;
  let prisma: any;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    prisma = {
      account: {
        findMany: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        findUnique: jest.fn<() => Promise<any>>().mockResolvedValue(null),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: { findUnique: jest.fn() },
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaAccountRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(PrismaAccountRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should map accounts with owners from the ordered query', async () => {
    // Arrange
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    prisma.account.findMany.mockResolvedValue([
      {
        accountNumber: '1002',
        balance: 25,
        updatedAt,
        user: { email: 'owner@example.com', name: 'Owner' },
      },
    ]);

    // Act
    const result = await repository.findAll();

    // Assert
    expect(prisma.account.findMany).toHaveBeenCalledWith({
      include: { user: { select: { email: true, name: true } } },
      orderBy: { accountNumber: 'asc' },
    });
    expect(result).toEqual([
      {
        accountNumber: '1002',
        balance: 25,
        owner: { email: 'owner@example.com', name: 'Owner' },
        updatedAt,
      },
    ]);
  });

  it('should create an account and map its owner', async () => {
    // Arrange
    prisma.account.create.mockResolvedValue({
      id: 'account-id',
      accountNumber: '1001',
      balance: 80,
      user: { email: 'owner@example.com', name: 'Owner' },
    });

    // Act
    const result = await repository.create({
      accountNumber: '1001',
      balance: 80,
      userId: 'user-id',
    });

    // Assert
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: { accountNumber: '1001', balance: 80, userId: 'user-id' },
      include: { user: { select: { email: true, name: true } } },
    });
    expect(result).toEqual({
      id: 'account-id',
      accountNumber: '1001',
      balance: 80,
      owner: { email: 'owner@example.com', name: 'Owner' },
    });
  });

  it('should return null when an account number does not exist', async () => {
    // Arrange
    prisma.account.findUnique.mockResolvedValue(null);

    // Act
    const result = await repository.findByNumber('missing');

    // Assert
    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: { accountNumber: 'missing' },
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        status: true,
        userId: true,
        updatedAt: true,
      },
    });
    expect(result).toBeNull();
  });

  it('should return an account with its selected user fields', async () => {
    const account = {
      id: 'account-id',
      accountNumber: '1001',
      balance: 80,
      status: 'ACTIVE',
      userId: 'user-id',
      user: { id: 'user-id', email: 'owner@example.com', name: 'Owner' },
    };
    prisma.account.findUnique.mockResolvedValue(account);

    await expect(repository.findByNumberWithUser('1001')).resolves.toBe(account);
    expect(prisma.account.findUnique).toHaveBeenCalledWith({
      where: { accountNumber: '1001' },
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        status: true,
        userId: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
  });

  it('should look up a user by email with only public identity fields', async () => {
    const user = { id: 'user-id', email: 'owner@example.com', name: 'Owner' };
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(repository.findUserByEmail('owner@example.com')).resolves.toBe(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'owner@example.com' },
      select: { id: true, email: true, name: true },
    });
  });

  it('should update an account status and return the selected fields', async () => {
    const updatedAt = new Date('2026-01-03T00:00:00.000Z');
    const updated = { accountNumber: '1001', status: 'SUSPENDED', updatedAt };
    prisma.account.update.mockResolvedValue(updated);

    await expect(repository.updateStatus('1001', 'SUSPENDED')).resolves.toBe(updated);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { accountNumber: '1001' },
      data: { status: 'SUSPENDED' },
      select: { accountNumber: true, status: true, updatedAt: true },
    });
  });
});
