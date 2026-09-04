import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/adapters/prisma/prisma.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    let dbStatus = 'connected';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.log('✅ Conexión a PostgreSQL exitosa');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      dbStatus = 'disconnected';
      this.logger.error('❌ Error conectando a PostgreSQL:', errorMessage);
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: dbStatus,
    };
  }
}