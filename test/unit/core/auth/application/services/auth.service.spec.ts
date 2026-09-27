import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthService } from '../../../../../../src/core/auth/application/services/auth.service';
import { LoginDto } from '../../../../../../src/core/auth/application/dto/login.dto';
import { RefreshTokenDto } from '../../../../../../src/core/auth/application/dto/refresh-token.dto';
import { RegisterDto } from '../../../../../../src/core/auth/application/dto/register.dto';
import {
  AUTH_SERVICE,
} from '../../../../../../src/core/auth/application/ports/auth-service.port';
import {
  ILoginUseCase,
  LOGIN_USE_CASE,
} from '../../../../../../src/core/auth/application/ports/login.port';
import {
  IRefreshUseCase,
  REFRESH_USE_CASE,
} from '../../../../../../src/core/auth/application/ports/refresh.port';
import {
  IRegisterUseCase,
  REGISTER_USE_CASE,
} from '../../../../../../src/core/auth/application/ports/register.port';
import {
  UserEntity,
  UserRole,
} from '../../../../../../src/core/auth/domain/entities/user.entity';

describe('AuthService', () => {
  let authService: AuthService;
  let module: TestingModule;
  let registerUseCase: jest.Mocked<IRegisterUseCase>;
  let loginUseCase: jest.Mocked<ILoginUseCase>;
  let refreshUseCase: jest.Mocked<IRefreshUseCase>;

  const user = UserEntity.hydrate({
    id: 'user-123',
    email: 'user@banco.com',
    password: 'stored-hash',
    name: 'Test User',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  });

  beforeEach(async () => {
    registerUseCase = { execute: jest.fn() };
    loginUseCase = { execute: jest.fn() };
    refreshUseCase = { execute: jest.fn() };

    module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_SERVICE, useClass: AuthService },
        { provide: REGISTER_USE_CASE, useValue: registerUseCase },
        { provide: LOGIN_USE_CASE, useValue: loginUseCase },
        { provide: REFRESH_USE_CASE, useValue: refreshUseCase },
      ],
    }).compile();

    authService = module.get(AuthService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('register', () => {
    it('should delegate registration and map the user response', async () => {
      // Arrange
      const dto: RegisterDto = {
        email: 'user@banco.com',
        password: 'SecurePass1!',
        name: 'Test User',
      };
      registerUseCase.execute.mockResolvedValue({
        user,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      const result = await authService.register(dto);

      // Assert
      expect(registerUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'user@banco.com',
          name: 'Test User',
          role: UserRole.USER,
          initials: 'TU',
          isCorporate: true,
          createdAt: user.getCreatedAt(),
          updatedAt: user.getUpdatedAt(),
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('should delegate login and map the user response', async () => {
      // Arrange
      const dto: LoginDto = {
        email: 'user@banco.com',
        password: 'SecurePass1!',
      };
      loginUseCase.execute.mockResolvedValue({
        user,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      // Act
      const result = await authService.login(dto);

      // Assert
      expect(loginUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'user@banco.com',
        name: 'Test User',
        role: UserRole.USER,
        initials: 'TU',
        isCorporate: true,
        createdAt: user.getCreatedAt(),
        updatedAt: user.getUpdatedAt(),
      });
      expect(result).toMatchObject({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('refresh', () => {
    it('should delegate token refresh and return the access token', async () => {
      // Arrange
      const dto: RefreshTokenDto = { refreshToken: 'valid-refresh-token' };
      refreshUseCase.execute.mockResolvedValue({
        accessToken: 'new-access-token',
      });

      // Act
      const result = await authService.refresh(dto);

      // Assert
      expect(refreshUseCase.execute).toHaveBeenCalledWith(dto.refreshToken);
      expect(result).toEqual({ accessToken: 'new-access-token' });
    });
  });
});
