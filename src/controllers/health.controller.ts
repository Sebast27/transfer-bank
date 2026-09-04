import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../infrastructure/adapters/prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prismaService: PrismaService) {}
  
  @Get()
  async check() {
    let dbStatus = 'connected';

    try {
      await this.prismaService.$queryRaw`SELECT 1`;
    } catch (error) {
      dbStatus = 'disconnected';
      this.logger.error('Database connection failed', error);
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus
    };
  }
}