import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HealthController } from '../../../../src/presentation/controllers/health.controller';
import { PrismaService } from '../../../../src/infrastructure/adapters/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let module: TestingModule;
  let prisma: {
    $queryRaw: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
  };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = module.get(HealthController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('check', () => {
    it('should report a connected database when the query succeeds', async () => {
      // Arrange
      prisma.$queryRaw.mockResolvedValue(1);

      // Act
      const result = await controller.check();

      // Assert
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        status: 'ok',
        database: 'connected',
        environment: process.env.NODE_ENV || 'development',
      });
      expect(result.timestamp).toEqual(expect.any(String));
    });

    it('should report a disconnected database when the query fails', async () => {
      // Arrange
      prisma.$queryRaw.mockRejectedValue(new Error('Database unavailable'));

      // Act
      const result = await controller.check();

      // Assert
      expect(result.status).toBe('ok');
      expect(result.database).toBe('disconnected');
    });

    it('should report a disconnected database when the query fails with a non-error value', async () => {
      // Arrange
      prisma.$queryRaw.mockRejectedValue('Unexpected database failure');

      // Act
      const result = await controller.check();

      // Assert
      expect(result.database).toBe('disconnected');
    });

    it('should default the environment to development when NODE_ENV is empty', async () => {
      // Arrange
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = '';
      prisma.$queryRaw.mockResolvedValue(1);

      try {
        // Act
        const result = await controller.check();

        // Assert
        expect(result.environment).toBe('development');
      } finally {
        if (originalNodeEnv === undefined) {
          delete process.env.NODE_ENV;
        } else {
          process.env.NODE_ENV = originalNodeEnv;
        }
      }
    });
  });
});
