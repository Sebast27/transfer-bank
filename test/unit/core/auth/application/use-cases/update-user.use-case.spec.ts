import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UpdateUserUseCase } from '../../../../../../src/core/auth/application/use-cases/update-user.use-case';
import { UpdateUserDto, UserRole } from '../../../../../../src/core/auth/application/dto/update-user.dto';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../../../../src/core/auth/domain/ports/user-repository.port';
import {
  AUTH_HASH_PORT,
  IAuthHashPort,
} from '../../../../../../src/core/auth/application/ports/auth-hash.port';

describe('UpdateUserUseCase', () => {
  let useCase: UpdateUserUseCase;
  let module: TestingModule;
  let userRepository: jest.Mocked<IUserRepository>;
  let authHashPort: jest.Mocked<IAuthHashPort>;

  const userId = 'user-123';
  const existingUser = (role = 'USER') => ({
    id: userId,
    email: 'user@example.com',
    password: 'stored-password-hash',
    name: 'Original Name',
    role,
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  });
  const updatedUser = (overrides: Partial<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    updatedAt: Date;
  }> = {}) => ({
    id: userId,
    email: 'user@example.com',
    name: 'Updated Name',
    role: 'USER',
    isActive: true,
    updatedAt: new Date('2025-01-03T00:00:00.000Z'),
    ...overrides,
  });

  beforeEach(async () => {
    userRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIdSimple: jest.fn(),
      update: jest.fn(),
    };
    authHashPort = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        UpdateUserUseCase,
        { provide: USER_REPOSITORY, useValue: userRepository },
        { provide: AUTH_HASH_PORT, useValue: authHashPort },
      ],
    }).compile();

    useCase = module.get(UpdateUserUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('execute', () => {
    it('should update the user name', async () => {
      // Arrange
      const dto: UpdateUserDto = { name: 'Updated Name' };
      const resultUser = updatedUser({ name: dto.name });
      userRepository.findById.mockResolvedValue(existingUser());
      userRepository.update.mockResolvedValue(resultUser);

      // Act
      const result = await useCase.execute(userId, dto);

      // Assert
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        name: 'Updated Name',
      });
      expect(authHashPort.hash).not.toHaveBeenCalled();
      expect(result).toEqual(resultUser);
    });

    it('should hash an updated password before passing it to the repository', async () => {
      // Arrange
      const password = 'NewPassword1!';
      const dto: UpdateUserDto = { password };
      userRepository.findById.mockResolvedValue(existingUser());
      userRepository.update.mockResolvedValue(updatedUser());
      authHashPort.hash.mockResolvedValue('new-password-hash');

      // Act
      await useCase.execute(userId, dto);

      // Assert
      expect(authHashPort.hash).toHaveBeenCalledWith(password);
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        password: 'new-password-hash',
      });
      expect(authHashPort.hash.mock.invocationCallOrder[0]).toBeLessThan(
        userRepository.update.mock.invocationCallOrder[0],
      );
    });

    it('should update the user role', async () => {
      // Arrange
      const dto: UpdateUserDto = { role: UserRole.ADMIN };
      userRepository.findById.mockResolvedValue(existingUser());
      userRepository.update.mockResolvedValue(
        updatedUser({ role: UserRole.ADMIN }),
      );

      // Act
      const result = await useCase.execute(userId, dto);

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        role: UserRole.ADMIN,
      });
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should update the user active status', async () => {
      // Arrange
      const dto: UpdateUserDto = { isActive: false };
      userRepository.findById.mockResolvedValue(existingUser());
      userRepository.update.mockResolvedValue(
        updatedUser({ isActive: false }),
      );

      // Act
      const result = await useCase.execute(userId, dto);

      // Assert
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        isActive: false,
      });
      expect(result.isActive).toBe(false);
    });

    it('should update multiple user fields at once', async () => {
      // Arrange
      const password = 'NewPassword1!';
      const dto: UpdateUserDto = {
        name: 'Updated Name',
        password,
        role: UserRole.ADMIN,
        isActive: false,
      };
      userRepository.findById.mockResolvedValue(existingUser());
      userRepository.update.mockResolvedValue(
        updatedUser({
          name: 'Updated Name',
          role: UserRole.ADMIN,
          isActive: false,
        }),
      );
      authHashPort.hash.mockResolvedValue('new-password-hash');

      // Act
      const result = await useCase.execute(userId, dto);

      // Assert
      expect(authHashPort.hash).toHaveBeenCalledWith(password);
      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        name: 'Updated Name',
        password: 'new-password-hash',
        role: UserRole.ADMIN,
        isActive: false,
      });
      expect(result).toEqual({
        id: userId,
        email: 'user@example.com',
        name: 'Updated Name',
        role: UserRole.ADMIN,
        isActive: false,
        updatedAt: new Date('2025-01-03T00:00:00.000Z'),
      });
    });

    it('should throw NotFoundException when the user does not exist', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act
      const update = () => useCase.execute(userId, { name: 'Updated Name' });

      // Assert
      await expect(update()).rejects.toMatchObject({
        name: 'NotFoundException',
        message: `User ${userId} not found`,
      });
      expect(userRepository.update).not.toHaveBeenCalled();
      expect(authHashPort.hash).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when the user is an admin', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(existingUser('ADMIN'));

      // Act
      const update = () => useCase.execute(userId, { name: 'Updated Name' });

      // Assert
      await expect(update()).rejects.toMatchObject({
        name: 'ForbiddenException',
        message: 'Cannot update an ADMIN user',
      });
      expect(userRepository.update).not.toHaveBeenCalled();
      expect(authHashPort.hash).not.toHaveBeenCalled();
    });

    it('should not hash a password when no password update is provided', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(existingUser());
      userRepository.update.mockResolvedValue(updatedUser());

      // Act
      await useCase.execute(userId, {});

      // Assert
      expect(authHashPort.hash).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(userId, {});
    });
  });
});
