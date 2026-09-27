import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HealthController as LegacyHealthController } from '../../../src/controllers/health.controller';
import { PrismaService } from '../../../src/infrastructure/adapters/prisma/prisma.service';

describe('LegacyHealthController', () => {
  let controller: LegacyHealthController;
  let module: TestingModule;
  let prisma: { $queryRaw: jest.Mock<(...args: unknown[]) => Promise<unknown>> };

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    };
    module = await Test.createTestingModule({
      controllers: [LegacyHealthController],
      providers: [{ provide: PrismaService, useValue: prisma }],
    }).compile();
    controller = module.get(LegacyHealthController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('check', () => {
    it('should return a healthy status when the database query succeeds', async () => {
      // Arrange
      prisma.$queryRaw.mockResolvedValue(1);

      // Act
      const result = await controller.check();

      // Assert
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({ status: 'ok', database: 'connected' });
    });

    it('should return a disconnected status when the database query fails', async () => {
      // Arrange
      prisma.$queryRaw.mockRejectedValue(new Error('Database unavailable'));

      // Act
      const result = await controller.check();

      // Assert
      expect(result).toMatchObject({ status: 'ok', database: 'disconnected' });
    });
  });
});
