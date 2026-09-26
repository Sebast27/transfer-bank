import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RefreshTokenUseCase } from '../../../../../../src/core/auth/application/use-cases/refresh-token.use-case';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../../../../../src/core/auth/domain/ports/auth-repository.port';
import {
  AUTH_TOKEN_PORT,
  IAuthTokenPort,
} from '../../../../../../src/core/auth/application/ports/auth-token.port';
import {
  UserEntity,
  UserRole,
} from '../../../../../../src/core/auth/domain/entities/user.entity';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let module: TestingModule;
  let authRepository: jest.Mocked<IAuthRepository>;
  let authTokenPort: jest.Mocked<IAuthTokenPort>;

  const refreshToken = 'valid-refresh-token';

  const createUser = (): UserEntity =>
    UserEntity.hydrate({
      id: 'user-123',
      email: 'user@example.com',
      password: 'stored-password-hash',
      name: 'Test User',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-02T00:00:00.000Z'),
    });

  beforeEach(async () => {
    authRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };
    authTokenPort = {
      generateTokens: jest.fn(),
      verifyToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        RefreshTokenUseCase,
        { provide: AUTH_REPOSITORY, useValue: authRepository },
        { provide: AUTH_TOKEN_PORT, useValue: authTokenPort },
      ],
    }).compile();

    useCase = module.get(RefreshTokenUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('execute', () => {
    it('should return a new access token for a valid refresh token', async () => {
      // Arrange
      const user = createUser();
      authTokenPort.verifyRefreshToken.mockResolvedValue({
        userId: user.getId(),
        email: user.getEmail(),
        role: user.getRole(),
      });
      authRepository.findById.mockResolvedValue(user);
      authTokenPort.generateTokens.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      // Act
      const result = await useCase.execute(refreshToken);

      // Assert
      expect(authTokenPort.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(authRepository.findById).toHaveBeenCalledWith(user.getId());
      expect(authTokenPort.generateTokens).toHaveBeenCalledWith(
        user.getId(),
        user.getEmail(),
        user.getRole(),
      );
      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(authTokenPort.verifyRefreshToken.mock.invocationCallOrder[0]).toBeLessThan(
        authRepository.findById.mock.invocationCallOrder[0],
      );
      expect(authRepository.findById.mock.invocationCallOrder[0]).toBeLessThan(
        authTokenPort.generateTokens.mock.invocationCallOrder[0],
      );
    });

    it('should reject when the refresh token verification returns null', async () => {
      // Arrange
      authTokenPort.verifyRefreshToken.mockResolvedValue(null as never);

      // Act
      const refresh = () => useCase.execute(refreshToken);

      // Assert
      await expect(refresh()).rejects.toMatchObject({
        name: 'UnauthorizedException',
        message: 'Invalid or expired refresh token',
      });
      expect(authTokenPort.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(authRepository.findById).not.toHaveBeenCalled();
      expect(authTokenPort.generateTokens).not.toHaveBeenCalled();
    });

    it('should reject when refresh token verification throws an error', async () => {
      // Arrange
      authTokenPort.verifyRefreshToken.mockRejectedValue(
        new Error('Token verification failed'),
      );

      // Act
      const refresh = () => useCase.execute(refreshToken);

      // Assert
      await expect(refresh()).rejects.toMatchObject({
        name: 'UnauthorizedException',
        message: 'Invalid or expired refresh token',
      });
      expect(authTokenPort.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(authRepository.findById).not.toHaveBeenCalled();
      expect(authTokenPort.generateTokens).not.toHaveBeenCalled();
    });

    it('should reject when the user from the token payload does not exist', async () => {
      // Arrange
      const payload = {
        userId: 'missing-user-id',
        email: 'user@example.com',
        role: UserRole.USER,
      };
      authTokenPort.verifyRefreshToken.mockResolvedValue(payload);
      authRepository.findById.mockResolvedValue(null);

      // Act
      const refresh = () => useCase.execute(refreshToken);

      // Assert
      await expect(refresh()).rejects.toMatchObject({
        name: 'UnauthorizedException',
        message: 'Invalid or expired refresh token',
      });
      expect(authTokenPort.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(authRepository.findById).toHaveBeenCalledWith(payload.userId);
      expect(authTokenPort.generateTokens).not.toHaveBeenCalled();
    });
  });
});
