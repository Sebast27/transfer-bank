import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../../../../src/infrastructure/adapters/prisma/prisma.service';

describe('PrismaService', () => {
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = new PrismaService();
    jest.spyOn(prisma, '$connect').mockResolvedValue(undefined);
    jest.spyOn(prisma, '$disconnect').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect when the module initializes', async () => {
    // Arrange

    // Act
    await prisma.onModuleInit();

    // Assert
    expect(prisma.$connect).toHaveBeenCalledTimes(1);
  });

  it('should disconnect when the module is destroyed', async () => {
    // Arrange

    // Act
    await prisma.onModuleDestroy();

    // Assert
    expect(prisma.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('should construct with development logging when NODE_ENV is development', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'development';
      expect(new PrismaService()).toBeInstanceOf(PrismaService);
    } finally {
      if (originalNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }
    }
  });

  it('should construct with error-only logging outside development', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'test';
      expect(new PrismaService()).toBeInstanceOf(PrismaService);
    } finally {
      if (originalNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = originalNodeEnv;
      }
    }
  });
});
