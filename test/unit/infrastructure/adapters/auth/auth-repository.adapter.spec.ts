import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UserEntity, UserRole } from '../../../../../src/core/auth/domain/entities/user.entity';
import { Email } from '../../../../../src/core/auth/domain/value-objects/email.vo';
import { Password } from '../../../../../src/core/auth/domain/value-objects/password.vo';
import { AuthRepositoryAdapter } from '../../../../../src/infrastructure/adapters/auth/auth-repository.adapter';
import { PrismaService } from '../../../../../src/infrastructure/adapters/prisma/prisma.service';

describe('AuthRepositoryAdapter', () => {
  let repository: AuthRepositoryAdapter;
  let prisma: any;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    moduleRef = await Test.createTestingModule({
      providers: [
        AuthRepositoryAdapter,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    repository = moduleRef.get(AuthRepositoryAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should hydrate a user found by email', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-02T00:00:00.000Z');
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password: 'hashed-password',
      name: 'Test User',
      role: 'ADMIN',
      isActive: false,
      createdAt,
      updatedAt,
    });

    const result = await repository.findByEmail('user@example.com');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    expect(result).toBeInstanceOf(UserEntity);
    expect(result?.toJSON()).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      name: 'Test User',
      role: UserRole.ADMIN,
      isActive: false,
      createdAt,
      updatedAt,
    });
    expect(result?.getPassword()).toBe('hashed-password');
  });

  it('should return null when no user matches the email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(repository.findByEmail('missing@example.com')).resolves.toBeNull();
  });

  it('should hydrate a user found by id', async () => {
    const createdAt = new Date('2026-03-01T00:00:00.000Z');
    const updatedAt = new Date('2026-03-02T00:00:00.000Z');
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-id',
      email: 'user@example.com',
      password: 'hashed-password',
      name: 'Test User',
      role: 'USER',
      isActive: true,
      createdAt,
      updatedAt,
    });

    const result = await repository.findById('user-id');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-id' } });
    expect(result?.toJSON()).toEqual({
      id: 'user-id',
      email: 'user@example.com',
      name: 'Test User',
      role: UserRole.USER,
      isActive: true,
      createdAt,
      updatedAt,
    });
  });

  it('should return null when no user matches the id', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it('should create and hydrate a user from its domain value objects', async () => {
    const createdAt = new Date('2026-04-01T00:00:00.000Z');
    const updatedAt = new Date('2026-04-02T00:00:00.000Z');
    const user = new UserEntity(
      new Email('user@example.com'),
      new Password('hashed-password', true),
      'Test User',
      UserRole.ADMIN,
      false,
    );
    prisma.user.create.mockResolvedValue({
      id: 'created-id',
      email: 'user@example.com',
      password: 'hashed-password',
      name: 'Test User',
      role: 'ADMIN',
      isActive: false,
      createdAt,
      updatedAt,
    });

    const result = await repository.create(user);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'user@example.com',
        password: 'hashed-password',
        name: 'Test User',
        role: UserRole.ADMIN,
        isActive: false,
      },
    });
    expect(result.toJSON()).toEqual({
      id: 'created-id',
      email: 'user@example.com',
      name: 'Test User',
      role: UserRole.ADMIN,
      isActive: false,
      createdAt,
      updatedAt,
    });
  });
});
