import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Transport } from '@nestjs/microservices';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  HealthCheckService,
  MicroserviceHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { HealthController } from '../../../../src/presentation/controllers/health.controller';
import { PrismaService } from '../../../../src/infrastructure/adapters/prisma/prisma.service';

type Indicator = () => Promise<unknown>;

describe('HealthController', () => {
  let controller: HealthController;
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
  const healthResult = { status: 'ok' };

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

    health.check.mockResolvedValue(healthResult);
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
    controller = module.get(HealthController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('liveness', () => {
    it('should check health without invoking dependency indicators', async () => {
      // Act
      const result = await controller.liveness();

      // Assert
      expect(result).toBe(healthResult);
      expect(health.check).toHaveBeenCalledWith([]);
      expect(prismaIndicator.pingCheck).not.toHaveBeenCalled();
      expect(microserviceIndicator.pingCheck).not.toHaveBeenCalled();
    });
  });

  describe.each([
    ['readiness', () => controller.readiness()],
    ['check', () => controller.check()],
  ])('%s', (_name, invoke) => {
    it('should check PostgreSQL and Redis using the configured connection', async () => {
      // Act
      const result = await invoke();
      const indicators = health.check.mock.calls[0][0];
      await Promise.all(indicators.map((indicator) => indicator()));

      // Assert
      expect(result).toBe(healthResult);
      expect(indicators).toHaveLength(2);
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
  });
});
