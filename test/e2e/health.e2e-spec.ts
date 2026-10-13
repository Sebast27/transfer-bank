import { INestApplication, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Transport } from '@nestjs/microservices';
import {
  HealthCheckService,
  MicroserviceHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import { PrismaService } from '../../src/infrastructure/adapters/prisma/prisma.service';
import { HealthController } from '../../src/presentation/controllers/health.controller';

type Indicator = () => Promise<unknown>;

describe('HealthController API (e2e)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let health: {
    check: jest.Mock<(indicators: Indicator[]) => Promise<unknown>>;
  };
  let prismaIndicator: {
    pingCheck: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };
  let microserviceIndicator: {
    pingCheck: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };
  let configService: {
    get: jest.Mock<(...args: unknown[]) => unknown>;
  };
  const prisma = {};
  const healthyResult = {
    status: 'ok',
    info: { database: { status: 'up' }, redis: { status: 'up' } },
    error: {},
    details: { database: { status: 'up' }, redis: { status: 'up' } },
  };

  beforeEach(async () => {
    health = {
      check: jest.fn<(indicators: Indicator[]) => Promise<unknown>>(),
    };
    prismaIndicator = {
      pingCheck: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    microserviceIndicator = {
      pingCheck: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    configService = {
      get: jest.fn<(...args: unknown[]) => unknown>(),
    };

    health.check.mockImplementation(async (indicators) => {
      await Promise.all(indicators.map((indicator) => indicator()));
      return indicators.length === 0
        ? { status: 'ok', info: {}, error: {}, details: {} }
        : healthyResult;
    });
    prismaIndicator.pingCheck.mockResolvedValue({ database: { status: 'up' } });
    microserviceIndicator.pingCheck.mockResolvedValue({ redis: { status: 'up' } });
    configService.get.mockImplementation((key) => {
      if (key === 'REDIS_HOST') return 'redis.test';
      if (key === 'REDIS_PORT') return 6379;
      return undefined;
    });

    module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: health },
        { provide: PrismaHealthIndicator, useValue: prismaIndicator },
        { provide: MicroserviceHealthIndicator, useValue: microserviceIndicator },
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('GET /api/v1/health/live', () => {
    it('should return a healthy liveness response without checking dependencies', async () => {
      // Act
      const response = await request(app.getHttpServer()).get('/api/v1/health/live');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'ok',
        info: {},
        error: {},
        details: {},
      });
      expect(health.check).toHaveBeenCalledWith([]);
      expect(prismaIndicator.pingCheck).not.toHaveBeenCalled();
      expect(microserviceIndicator.pingCheck).not.toHaveBeenCalled();
    });
  });

  describe.each([
    ['GET /api/v1/health/ready', '/api/v1/health/ready'],
    ['GET /api/v1/health', '/api/v1/health'],
  ])('%s', (_description, path) => {
    it('should check PostgreSQL and Redis and return a healthy response', async () => {
      // Act
      const response = await request(app.getHttpServer()).get(path);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(healthyResult);
      expect(health.check).toHaveBeenCalledTimes(1);
      expect(prismaIndicator.pingCheck).toHaveBeenCalledWith('database', prisma);
      expect(microserviceIndicator.pingCheck).toHaveBeenCalledWith('redis', {
        transport: Transport.REDIS,
        options: {
          host: 'redis.test',
          port: 6379,
        },
      });
      expect(configService.get).toHaveBeenNthCalledWith(1, 'REDIS_HOST');
      expect(configService.get).toHaveBeenNthCalledWith(2, 'REDIS_PORT');
    });

    it('should return HTTP 503 when a dependency is unavailable', async () => {
      // Arrange
      health.check.mockRejectedValueOnce(
        new ServiceUnavailableException({
          status: 'error',
          info: {},
          error: { database: { status: 'down' } },
          details: { database: { status: 'down' } },
        }),
      );

      // Act
      const response = await request(app.getHttpServer()).get(path);

      // Assert
      expect(response.status).toBe(503);
    });
  });
});