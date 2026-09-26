import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetUsersUseCase } from '../../../../../../src/core/auth/application/use-cases/get-users.use-case';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../../../../src/core/auth/domain/ports/user-repository.port';

describe('GetUsersUseCase', () => {
  let useCase: GetUsersUseCase;
  let module: TestingModule;
  let userRepository: jest.Mocked<IUserRepository>;

  beforeEach(async () => {
    userRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIdSimple: jest.fn(),
      update: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        GetUsersUseCase,
        { provide: USER_REPOSITORY, useValue: userRepository },
      ],
    }).compile();

    useCase = module.get(GetUsersUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('execute', () => {
    it('should map users and their accounts from the repository', async () => {
      // Arrange
      const createdAt = new Date('2025-01-01T10:00:00.000Z');
      const users = [
        {
          id: 'user-1',
          email: 'first@example.com',
          name: 'First User',
          role: 'USER',
          isActive: true,
          createdAt,
          accounts: [
            { accountNumber: 'account-1', balance: 125.5 },
            { accountNumber: 'account-2', balance: 0 },
          ],
        },
        {
          id: 'user-2',
          email: 'second@example.com',
          name: 'Second User',
          role: 'ADMIN',
          isActive: false,
          createdAt: new Date('2025-02-01T10:00:00.000Z'),
          accounts: [{ accountNumber: 'account-3', balance: 500 }],
        },
      ];
      userRepository.findAll.mockResolvedValue(users);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(userRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([
        {
          id: 'user-1',
          email: 'first@example.com',
          name: 'First User',
          role: 'USER',
          isActive: true,
          createdAt,
          accounts: [
            { accountNumber: 'account-1', balance: 125.5 },
            { accountNumber: 'account-2', balance: 0 },
          ],
        },
        {
          id: 'user-2',
          email: 'second@example.com',
          name: 'Second User',
          role: 'ADMIN',
          isActive: false,
          createdAt: new Date('2025-02-01T10:00:00.000Z'),
          accounts: [{ accountNumber: 'account-3', balance: 500 }],
        },
      ]);
      expect(result[0].id).toBe('user-1');
      expect(result[1].id).toBe('user-2');
    });

    it('should return an empty array when the repository has no users', async () => {
      // Arrange
      userRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
      expect(userRepository.findAll).toHaveBeenCalledTimes(1);
    });
  });
});
