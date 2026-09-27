import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { JwtTokenAdapter } from '../../../../../src/infrastructure/adapters/auth/jwt-token.adapter';

describe('JwtTokenAdapter', () => {
  let adapter: JwtTokenAdapter;
  let module: TestingModule;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verify'>>;
  let originalJwtSecret: string | undefined;
  let originalJwtRefreshSecret: string | undefined;

  const payload = {
    sub: 'unit-test-user-id',
    email: 'unit-test@example.invalid',
    role: 'USER',
  };

  beforeEach(async () => {
    originalJwtSecret = process.env.JWT_SECRET;
    originalJwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;

    jwtService = {
      signAsync: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<Pick<JwtService, 'signAsync' | 'verify'>>;

    module = await Test.createTestingModule({
      providers: [
        JwtTokenAdapter,
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    adapter = module.get(JwtTokenAdapter);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
    if (originalJwtRefreshSecret === undefined) {
      delete process.env.JWT_REFRESH_SECRET;
    } else {
      process.env.JWT_REFRESH_SECRET = originalJwtRefreshSecret;
    }
    await module.close();
  });

  it('should generate access and refresh tokens using fallback secrets', async () => {
    // Arrange
    jwtService.signAsync
      .mockResolvedValueOnce('mocked-access-token')
      .mockResolvedValueOnce('mocked-refresh-token');

    // Act
    const result = await adapter.generateTokens(
      payload.sub,
      payload.email,
      payload.role,
    );

    // Assert
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, payload, {
      secret: 'secret',
      expiresIn: '1h',
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(2, payload, {
      secret: 'refresh-secret',
      expiresIn: '7d',
    });
    expect(result).toEqual({
      accessToken: 'mocked-access-token',
      refreshToken: 'mocked-refresh-token',
    });
  });

  it('should generate tokens using configured secrets', async () => {
    // Arrange
    process.env.JWT_SECRET = 'unit-test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret';
    jwtService.signAsync
      .mockResolvedValueOnce('mocked-access-token')
      .mockResolvedValueOnce('mocked-refresh-token');

    // Act
    const result = await adapter.generateTokens(
      payload.sub,
      payload.email,
      payload.role,
    );

    // Assert
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, payload, {
      secret: 'unit-test-access-secret',
      expiresIn: '1h',
    });
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(2, payload, {
      secret: 'unit-test-refresh-secret',
      expiresIn: '7d',
    });
    expect(result).toEqual({
      accessToken: 'mocked-access-token',
      refreshToken: 'mocked-refresh-token',
    });
  });

  it('should verify an access token and map its payload', async () => {
    // Arrange
    const token = 'mocked-access-token';
    jwtService.verify.mockReturnValue(payload);

    // Act
    const result = await adapter.verifyToken(token);

    // Assert
    expect(jwtService.verify).toHaveBeenCalledWith(token, { secret: 'secret' });
    expect(result).toEqual({
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  });

  it('should verify an access token with the configured access secret', async () => {
    // Arrange
    const token = 'mocked-access-token';
    process.env.JWT_SECRET = 'unit-test-access-secret';
    jwtService.verify.mockReturnValue(payload);

    // Act
    const result = await adapter.verifyToken(token);

    // Assert
    expect(jwtService.verify).toHaveBeenCalledWith(token, {
      secret: 'unit-test-access-secret',
    });
    expect(result).toEqual({
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  });

  it('should verify a refresh token with the fallback refresh secret', async () => {
    // Arrange
    const token = 'mocked-refresh-token';
    jwtService.verify.mockReturnValue(payload);

    // Act
    const result = await adapter.verifyRefreshToken(token);

    // Assert
    expect(jwtService.verify).toHaveBeenCalledWith(token, {
      secret: 'refresh-secret',
    });
    expect(result).toEqual({
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  });

  it('should verify a refresh token with the refresh secret and map its payload', async () => {
    // Arrange
    const token = 'mocked-refresh-token';
    process.env.JWT_REFRESH_SECRET = 'unit-test-refresh-secret';
    jwtService.verify.mockReturnValue(payload);

    // Act
    const result = await adapter.verifyRefreshToken(token);

    // Assert
    expect(jwtService.verify).toHaveBeenCalledWith(token, {
      secret: 'unit-test-refresh-secret',
    });
    expect(result).toEqual({
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  });

  it('should propagate access token verification errors', async () => {
    // Arrange
    const token = 'invalid-mocked-access-token';
    const error = new Error('Mock token verification failure');
    jwtService.verify.mockImplementation(() => {
      throw error;
    });

    // Act
    const verify = () => adapter.verifyToken(token);

    // Assert
    await expect(verify()).rejects.toBe(error);
    expect(jwtService.verify).toHaveBeenCalledWith(token, { secret: 'secret' });
  });
});
