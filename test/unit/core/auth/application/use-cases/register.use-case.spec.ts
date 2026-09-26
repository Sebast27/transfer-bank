import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RegisterUseCase } from '../../../../../../src/core/auth/application/use-cases/register.use-case';
import { RegisterDto } from '../../../../../../src/core/auth/application/dto/register.dto';
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
import { Email } from '../../../../../../src/core/auth/domain/value-objects/email.vo';
import { Password } from '../../../../../../src/core/auth/domain/value-objects/password.vo';

describe('RegisterUseCase', () => {
  let useCase: RegisterUseCase;
  let module: TestingModule;
  let authRepository: jest.Mocked<IAuthRepository>;
  let authTokenPort: jest.Mocked<IAuthTokenPort>;
  let authHashPort: jest.Mocked<IAuthHashPort>;

  const registerDto: RegisterDto = {
    email: 'new.user@example.com',
    password: 'SecurePass1!',
    name: 'New User',
  };

  const createExistingUser = (): UserEntity =>
    UserEntity.hydrate({
      id: 'existing-user-id',
      email: 'new.user@example.com',
      password: 'stored-hash',
      name: 'Existing User',
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
    authHashPort = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        RegisterUseCase,
        { provide: AUTH_REPOSITORY, useValue: authRepository },
        { provide: AUTH_TOKEN_PORT, useValue: authTokenPort },
        { provide: AUTH_HASH_PORT, useValue: authHashPort },
      ],
    }).compile();

    useCase = module.get(RegisterUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('execute', () => {
    it('should register a user and return the user with generated tokens', async () => {
      // Arrange
      const savedUser = UserEntity.hydrate({
        id: 'created-user-id',
        email: registerDto.email,
        password: 'hashed-password',
        name: registerDto.name,
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      });
      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      authRepository.findByEmail.mockResolvedValue(null);
      authHashPort.hash.mockResolvedValue('hashed-password');
      authRepository.create.mockResolvedValue(savedUser);
      authTokenPort.generateTokens.mockResolvedValue(tokens);

      // Act
      const result = await useCase.execute(registerDto);

      // Assert
      expect(authRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(authHashPort.hash).toHaveBeenCalledWith(registerDto.password);
      expect(authRepository.create).toHaveBeenCalledTimes(1);
      expect(authTokenPort.generateTokens).toHaveBeenCalledWith(
        savedUser.getId(),
        savedUser.getEmail(),
        savedUser.getRole(),
      );
      expect(result).toEqual({ user: savedUser, ...tokens });
      expect(result.user).toBe(savedUser);
      expect(result.accessToken).toBe(tokens.accessToken);
      expect(result.refreshToken).toBe(tokens.refreshToken);
    });

    it('should throw a ConflictException when the email is already registered', async () => {
      // Arrange
      authRepository.findByEmail.mockResolvedValue(createExistingUser());

      // Act
      const register = () => useCase.execute(registerDto);

      // Assert
      await expect(register()).rejects.toMatchObject({
        name: 'ConflictException',
        message: 'Email already registered',
      });
      expect(authRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(authHashPort.hash).not.toHaveBeenCalled();
      expect(authRepository.create).not.toHaveBeenCalled();
      expect(authTokenPort.generateTokens).not.toHaveBeenCalled();
    });

    it('should reject an invalid email before creating a user', async () => {
      // Arrange
      const invalidEmailDto = { ...registerDto, email: 'invalid-email' };
      authRepository.findByEmail.mockResolvedValue(null);

      // Act
      const register = () => useCase.execute(invalidEmailDto);

      // Assert
      await expect(register()).rejects.toThrow('Email must contain @');
      expect(authRepository.findByEmail).toHaveBeenCalledWith(
        invalidEmailDto.email,
      );
      expect(authRepository.create).not.toHaveBeenCalled();
      expect(authHashPort.hash).not.toHaveBeenCalled();
    });

    it('should reject an invalid password before creating a user', async () => {
      // Arrange
      const invalidPasswordDto = { ...registerDto, password: 'weak' };
      authRepository.findByEmail.mockResolvedValue(null);

      // Act
      const register = () => useCase.execute(invalidPasswordDto);

      // Assert
      await expect(register()).rejects.toThrow(
        'Password must be at least 8 characters long',
      );
      expect(authRepository.findByEmail).toHaveBeenCalledWith(
        invalidPasswordDto.email,
      );
      expect(authRepository.create).not.toHaveBeenCalled();
      expect(authHashPort.hash).not.toHaveBeenCalled();
    });

    it('should hash the password before passing the user to the repository', async () => {
      // Arrange
      const hashedValue = 'secure-hashed-password';
      const savedUser = UserEntity.hydrate({
        id: 'created-user-id',
        email: registerDto.email,
        password: hashedValue,
        name: registerDto.name,
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      });
      authRepository.findByEmail.mockResolvedValue(null);
      authHashPort.hash.mockResolvedValue(hashedValue);
      authRepository.create.mockResolvedValue(savedUser);
      authTokenPort.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      await useCase.execute(registerDto);

      // Assert
      const userPassedToCreate = authRepository.create.mock.calls[0][0];
      expect(authHashPort.hash.mock.invocationCallOrder[0]).toBeLessThan(
        authRepository.create.mock.invocationCallOrder[0],
      );
      expect(userPassedToCreate.password).toBeInstanceOf(Password);
      expect(userPassedToCreate.password.getValue()).toBe(hashedValue);
      expect(userPassedToCreate.password.getValue()).not.toBe(
        registerDto.password,
      );
      expect(userPassedToCreate.email).toBeInstanceOf(Email);
    });
  });
});
