import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../../src/infrastructure/adapters/prisma/prisma.service';
import { PrismaUserRepository } from '../../../../../src/infrastructure/adapters/prisma/user-repository.prisma';

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let prisma: any;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaUserRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(PrismaUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should map users and their accounts from the newest-first query', async () => {
    // Arrange
    const createdAt = new Date('2026-03-01T00:00:00.000Z');
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        role: 'CUSTOMER',
        isActive: true,
        createdAt,
        accounts: [{ accountNumber: '1001', balance: 40 }],
      },
    ]);

    // Act
    const result = await repository.findAll();

    // Assert
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      include: { accounts: { select: { accountNumber: true, balance: true } } },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual([
      {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        role: 'CUSTOMER',
        isActive: true,
        createdAt,
        accounts: [{ accountNumber: '1001', balance: 40 }],
      },
    ]);
  });

  it('should update only supplied user fields, including false values', async () => {
    // Arrange
    const updatedAt = new Date('2026-03-02T00:00:00.000Z');
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Updated',
      role: 'ADMIN',
      isActive: false,
      updatedAt,
    });

    // Act
    const result = await repository.update('user-1', {
      name: 'Updated',
      role: 'ADMIN',
      isActive: false,
    });

    // Assert
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { name: 'Updated', role: 'ADMIN', isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
    expect(result.isActive).toBe(false);
    expect(result.updatedAt).toBe(updatedAt);
  });

  it('should return null when a user identifier is not found', async () => {
    // Arrange
    prisma.user.findUnique.mockResolvedValue(null);

    // Act
    const result = await repository.findByIdSimple('missing');

    // Assert
    expect(result).toBeNull();
  });

  it('should find a user by identifier', async () => {
    // Arrange
    const user = { id: 'user-1', email: 'user@example.com' };
    prisma.user.findUnique.mockResolvedValue(user);

    // Act
    const result = await repository.findById('user-1');

    // Assert
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
    expect(result).toBe(user);
  });

  it('should omit fields that are not included in a partial update', async () => {
    // Arrange
    const updatedAt = new Date('2026-03-03T00:00:00.000Z');
    const updatedUser = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      role: 'USER',
      isActive: true,
      updatedAt,
    };
    prisma.user.update.mockResolvedValue(updatedUser);

    // Act
    const result = await repository.update('user-1', {});

    // Assert
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {},
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
    expect(result).toBe(updatedUser);
  });

  it('should include a new password hash in an update', async () => {
    // Arrange
    const updatedUser = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      role: 'USER',
      isActive: true,
      updatedAt: new Date('2026-03-04T00:00:00.000Z'),
    };
    prisma.user.update.mockResolvedValue(updatedUser);

    // Act
    await repository.update('user-1', { password: 'hashed-password' });

    // Assert
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { password: 'hashed-password' },
      }),
    );
  });
});
