import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  AUTH_REPOSITORY,
  IAuthRepository,
} from '../../../../../../src/core/auth/domain/ports/auth-repository.port';
import { UserEntity, UserRole } from '../../../../../../src/core/auth/domain/entities/user.entity';
import { JwtStrategy } from '../../../../../../src/infrastructure/adapters/auth/strategies/jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let module: TestingModule;
  let authRepository: jest.Mocked<IAuthRepository>;
  let originalJwtSecret: string | undefined;

  beforeEach(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    authRepository = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: AUTH_REPOSITORY, useValue: authRepository },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
    await module.close();
  });

  it('should configure bearer extraction, expiration checking, and the fallback secret', () => {
    // Arrange
    const configuredStrategy = strategy as unknown as {
      _jwtFromRequest: (request: { headers: Record<string, string> }) => string | null;
      _secretOrKeyProvider: (
        request: object,
        token: string,
        done: (error: Error | null, secret?: string) => void,
      ) => void;
      _verifOpts: { ignoreExpiration: boolean };
    };
    const request = { headers: { authorization: 'Bearer mocked-token' } };
    let configuredSecret: string | undefined;

    // Act
    const extractedToken = configuredStrategy._jwtFromRequest(request);
    configuredStrategy._secretOrKeyProvider(request, extractedToken as string, (_error, secret) => {
      configuredSecret = secret;
    });

    // Assert
    expect(extractedToken).toBe('mocked-token');
    expect(configuredSecret).toBe('secret');
    expect(configuredStrategy._verifOpts.ignoreExpiration).toBe(false);
  });

  it('should use the configured JWT secret', async () => {
    // Arrange
    await module.close();
    process.env.JWT_SECRET = 'unit-test-jwt-secret';
    module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: AUTH_REPOSITORY, useValue: authRepository },
      ],
    }).compile();
    strategy = module.get(JwtStrategy);
    const configuredStrategy = strategy as unknown as {
      _secretOrKeyProvider: (
        request: object,
        token: string,
        done: (error: Error | null, secret?: string) => void,
      ) => void;
    };
    let configuredSecret: string | undefined;

    // Act
    configuredStrategy._secretOrKeyProvider({}, 'mocked-token', (_error, secret) => {
      configuredSecret = secret;
    });

    // Assert
    expect(configuredSecret).toBe('unit-test-jwt-secret');
  });

  it('should return null when the token subject does not identify a user', async () => {
    // Arrange
    const payload = {
      sub: 'missing-unit-test-user',
      email: 'unit-test@example.com',
      role: UserRole.USER,
    };
    authRepository.findById.mockResolvedValue(null);

    // Act
    const result = await strategy.validate(payload);

    // Assert
    expect(authRepository.findById).toHaveBeenCalledWith(payload.sub);
    expect(result).toBeNull();
  });

  it('should map a token payload to the authenticated user', async () => {
    // Arrange
    const user = UserEntity.hydrate({
      id: 'unit-test-user-id',
      email: 'unit-test@example.com',
      password: 'mocked-password-hash',
      name: 'Unit Test User',
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-02T00:00:00.000Z'),
    });
    authRepository.findById.mockResolvedValue(user);
    const payload = {
      sub: user.getId(),
      email: user.getEmail(),
      role: UserRole.ADMIN,
    };

    // Act
    const result = await strategy.validate(payload);

    // Assert
    expect(authRepository.findById).toHaveBeenCalledWith(payload.sub);
    expect(result).toEqual({
      id: user.getId(),
      email: user.getEmail(),
      role: UserRole.ADMIN,
      name: user.getName(),
    });
  });
});
