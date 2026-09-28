import { INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import { AUTH_SERVICE, IAuthService } from '../../src/core/auth/application/ports/auth-service.port';
import { UserRole } from '../../src/core/auth/domain/entities/user.entity';
import { AuthController } from '../../src/presentation/controllers/auth.controller';

describe('Rate limiting API (e2e)', () => {
  let app: INestApplication;
  let authService: jest.Mocked<IAuthService>;

  beforeEach(async () => {
    authService = {
      register: jest.fn<IAuthService['register']>().mockResolvedValue({
        user: {
          id: 'user-id',
          email: 'user@example.com',
          name: 'Test User',
          role: UserRole.USER,
          initials: 'TU',
          isCorporate: false,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
      login: jest.fn<IAuthService['login']>().mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      ),
      refresh: jest.fn<IAuthService['refresh']>().mockResolvedValue({
        accessToken: 'access-token',
      }),
    };

    const module = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'short',
            ttl: 1_000,
            limit: 3,
          },
          {
            name: 'medium',
            ttl: 10_000,
            limit: 20,
          },
          {
            name: 'long',
            ttl: 60_000,
            limit: 100,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AUTH_SERVICE, useValue: authService },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
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

  describe('POST /auth/login', () => {
    it('should allow five attempts and throttle the sixth attempt', async () => {
      // Arrange
      const payload = {
        email: 'attacker@example.com',
        password: 'WrongPassword1!',
      };
      const statuses: number[] = [];

      // Act
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(payload);
        statuses.push(response.status);
      }
      await new Promise((resolve) => setTimeout(resolve, 1_100));
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send(payload);
        statuses.push(response.status);
      }
      await new Promise((resolve) => setTimeout(resolve, 1_100));
      const blockedResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(payload);
      statuses.push(blockedResponse.status);

      // Assert
      expect(statuses).toEqual([401, 401, 401, 401, 401, 429]);
      expect(authService.login).toHaveBeenCalledTimes(5);
    });
  });

  describe('POST /auth/register', () => {
    it('should allow three attempts and throttle the fourth attempt', async () => {
      // Arrange
      const payload = {
        email: 'new.user@example.com',
        password: 'ValidPass1!',
        name: 'New User',
      };
      const statuses: number[] = [];

      // Act
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/auth/register')
          .send({ ...payload, email: `new.user${attempt}@example.com` });
        statuses.push(response.status);
      }
      await new Promise((resolve) => setTimeout(resolve, 1_100));
      const blockedResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...payload, email: 'new.user4@example.com' });
      statuses.push(blockedResponse.status);

      // Assert
      expect(statuses).toEqual([201, 201, 201, 429]);
      expect(authService.register).toHaveBeenCalledTimes(3);
    });
  });
});
