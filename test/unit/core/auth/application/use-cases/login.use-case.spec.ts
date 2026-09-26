import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LoginUseCase } from '../../../../../../src/core/auth/application/use-cases/login.use-case';
import { LoginDto } from '../../../../../../src/core/auth/application/dto/login.dto';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../../../../../src/core/auth/domain/ports/auth-repository.port';
import {
  AUTH_TOKEN_PORT,
  IAuthTokenPort,
} from '../../../../../../src/core/auth/application/ports/auth-token.port';
import {
  AUTH_HASH_PORT,
  IAuthHashPort,
} from '../../../../../../src/core/auth/application/ports/auth-hash.port';
import {
  UserEntity,
  UserRole,
} from '../../../../../../src/core/auth/domain/entities/user.entity';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let module: TestingModule;
  let authRepository: jest.Mocked<IAuthRepository>;
  let authTokenPort: jest.Mocked<IAuthTokenPort>;
  let authHashPort: jest.Mocked<IAuthHashPort>;

  const loginDto: LoginDto = {
    email: 'user@example.com',
    password: 'PlainPassword1!',
  };

  const createUser = (isActive = true): UserEntity =>
    UserEntity.hydrate({
      id: 'user-123',
      email: loginDto.email,
      password: 'stored-password-hash',
      name: 'Test User',
      role: UserRole.USER,
      isActive,
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
    authHashPort = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        { provide: AUTH_REPOSITORY, useValue: authRepository },
        { provide: AUTH_TOKEN_PORT, useValue: authTokenPort },
        { provide: AUTH_HASH_PORT, useValue: authHashPort },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('execute', () => {
    it('should log in an active user and return the user with tokens', async () => {
      // Arrange
      const user = createUser();
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      authRepository.findByEmail.mockResolvedValue(user);
      authHashPort.compare.mockResolvedValue(true);
      authTokenPort.generateTokens.mockResolvedValue(tokens);

      // Act
      const result = await useCase.execute(loginDto);

      // Assert
      expect(authRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(authHashPort.compare).toHaveBeenCalledWith(
        loginDto.password,
        user.getPassword(),
      );
      expect(authTokenPort.generateTokens).toHaveBeenCalledWith(
        user.getId(),
        user.getEmail(),
        user.getRole(),
      );
      expect(result).toEqual({ user, ...tokens });
      expect(result.user).toBe(user);
      expect(result.accessToken).toBe(tokens.accessToken);
      expect(result.refreshToken).toBe(tokens.refreshToken);
      expect(authRepository.findByEmail.mock.invocationCallOrder[0]).toBeLessThan(
        authHashPort.compare.mock.invocationCallOrder[0],
      );
      expect(authHashPort.compare.mock.invocationCallOrder[0]).toBeLessThan(
        authTokenPort.generateTokens.mock.invocationCallOrder[0],
      );
    });

    it('should reject the login when the email does not exist', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(null);

      // Act
      const login = () => useCase.execute(loginDto);

      // Assert
      await expect(login()).rejects.toMatchObject({
        name: 'UnauthorizedException',
        message: 'Invalid credentials',
      });
      expect(authRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(authHashPort.compare).not.toHaveBeenCalled();
      expect(authTokenPort.generateTokens).not.toHaveBeenCalled();
    });

    it('should reject the login when the password does not match', async () => {
      // Arrange
      const user = createUser();
      authRepository.findByEmail.mockResolvedValue(user);
      authHashPort.compare.mockResolvedValue(false);

      // Act
      const login = () => useCase.execute(loginDto);

      // Assert
      await expect(login()).rejects.toMatchObject({
        name: 'UnauthorizedException',
        message: 'Invalid credentials',
      });
      expect(authRepository.findByEmail.mock.invocationCallOrder[0]).toBeLessThan(
        authHashPort.compare.mock.invocationCallOrder[0],
      );
      expect(authTokenPort.generateTokens).not.toHaveBeenCalled();
    });

    it('should reject the login when the user account is disabled', async () => {
      // Arrange
      const user = createUser(false);
      authRepository.findByEmail.mockResolvedValue(user);
      authHashPort.compare.mockResolvedValue(true);

      // Act
      const login = () => useCase.execute(loginDto);

      // Assert
      await expect(login()).rejects.toMatchObject({
        name: 'UnauthorizedException',
        message: 'User account is disabled',
      });
      expect(authRepository.findByEmail.mock.invocationCallOrder[0]).toBeLessThan(
        authHashPort.compare.mock.invocationCallOrder[0],
      );
      expect(authTokenPort.generateTokens).not.toHaveBeenCalled();
    });
  });
});
