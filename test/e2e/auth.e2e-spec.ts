import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../../src/presentation/controllers/auth.controller';
import { LoginUseCase } from '../../src/core/auth/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../src/core/auth/application/use-cases/refresh-token.use-case';
import { RegisterUseCase } from '../../src/core/auth/application/use-cases/register.use-case';
import { AuthService } from '../../src/core/auth/application/services/auth.service';
import {
  AUTH_SERVICE,
} from '../../src/core/auth/application/ports/auth-service.port';
import {
  LOGIN_USE_CASE,
} from '../../src/core/auth/application/ports/login.port';
import {
  REFRESH_USE_CASE,
} from '../../src/core/auth/application/ports/refresh.port';
import {
  REGISTER_USE_CASE,
} from '../../src/core/auth/application/ports/register.port';
import {
  AUTH_HASH_PORT,
  IAuthHashPort,
} from '../../src/core/auth/application/ports/auth-hash.port';
import {
  AUTH_TOKEN_PORT,
  IAuthTokenPort,
} from '../../src/core/auth/application/ports/auth-token.port';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../src/core/auth/domain/ports/auth-repository.port';
import { UserEntity, UserRole } from '../../src/core/auth/domain/entities/user.entity';

describe('Auth API (integration)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let authRepository: jest.Mocked<IAuthRepository>;
  let authHashPort: jest.Mocked<IAuthHashPort>;
  let authTokenPort: jest.Mocked<IAuthTokenPort>;
  const usersByEmail = new Map<string, UserEntity>();
  const usersById = new Map<string, UserEntity>();

  beforeEach(async () => {
    usersByEmail.clear();
    usersById.clear();

    authRepository = {
      findByEmail: jest.fn(async (email: string) => usersByEmail.get(email) ?? null),
      findById: jest.fn(async (id: string) => usersById.get(id) ?? null),
      create: jest.fn(async (user) => {
        const savedUser = new UserEntity(
          user.email,
          user.password,
          user.name,
          user.role,
          user.isActive,
        );
        usersByEmail.set(savedUser.getEmail(), savedUser);
        usersById.set(savedUser.getId(), savedUser);
        return savedUser;
      }),
    };
    authHashPort = {
      hash: jest.fn(async (password: string) => `hashed:${password}`),
      compare: jest.fn(async (password: string, hash: string) => hash === `hashed:${password}`),
    };
    authTokenPort = {
      generateTokens: jest.fn(async (userId: string) => ({
        accessToken: `access:${userId}`,
        refreshToken: `refresh:${userId}`,
      })),
      verifyToken: jest.fn(),
      verifyRefreshToken: jest.fn(async (token: string) => {
        const userId = token.replace('refresh:', '');
        const user = usersById.get(userId);
        return user
          ? { userId, email: user.getEmail(), role: user.getRole() }
          : null as never;
      }),
    };

    module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AUTH_SERVICE, useClass: AuthService },
        { provide: REGISTER_USE_CASE, useClass: RegisterUseCase },
        { provide: LOGIN_USE_CASE, useClass: LoginUseCase },
        { provide: REFRESH_USE_CASE, useClass: RefreshTokenUseCase },
        { provide: AUTH_REPOSITORY, useValue: authRepository },
        { provide: AUTH_HASH_PORT, useValue: authHashPort },
        { provide: AUTH_TOKEN_PORT, useValue: authTokenPort },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('should register, log in, and refresh tokens through the auth API', async () => {
    // Arrange
    const registration = {
      email: 'new.user@banco.com',
      password: 'SecurePass1!',
      name: 'New User',
    };

    // Act
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(registration);
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: registration.email, password: registration.password });
    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: registerResponse.body.refreshToken });

    // Assert
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body).toMatchObject({
      user: {
        email: registration.email,
        name: registration.name,
        role: UserRole.USER,
        initials: 'NU',
        isCorporate: true,
      },
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    });
    expect(registerResponse.body.user).not.toHaveProperty('password');
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.email).toBe(registration.email);
    expect(loginResponse.body).toHaveProperty('accessToken');
    expect(loginResponse.body).toHaveProperty('refreshToken');
    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toEqual({
      accessToken: registerResponse.body.accessToken,
    });
    expect(authRepository.findByEmail).toHaveBeenCalledTimes(2);
    expect(authHashPort.hash).toHaveBeenCalledWith(registration.password);
    expect(authHashPort.compare).toHaveBeenCalledWith(
      registration.password,
      `hashed:${registration.password}`,
    );
  });

  it('should return a validation error for an invalid registration payload', async () => {
    // Arrange
    const invalidRegistration = {
      email: 'not-an-email',
      password: 'weak',
      name: 'Valid Name',
      unexpected: true,
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(invalidRegistration);

    // Assert
    expect(response.status).toBe(400);
    expect(authRepository.create).not.toHaveBeenCalled();
  });

  it('should return a conflict response when registering a duplicate email', async () => {
    // Arrange
    const registration = {
      email: 'duplicate@banco.com',
      password: 'SecurePass1!',
      name: 'Duplicate User',
    };

    // Act
    const firstResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(registration);
    const duplicateResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(registration);

    // Assert
    expect(firstResponse.status).toBe(201);
    expect(duplicateResponse.status).toBe(409);
    expect(authRepository.create).toHaveBeenCalledTimes(1);
  });
});
