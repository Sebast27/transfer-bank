import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MicroserviceHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../../infrastructure/adapters/prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly microserviceIndicator: MicroserviceHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * Liveness probe: ¿el proceso sigue vivo?
   * No chequea dependencias externas. Usado por orquestadores (K8s)
   * para decidir si reiniciar el contenedor.
   */
  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Proceso vivo' })
  @HealthCheck()
  liveness() {
    return this.health.check([]);
  }

  /**
   * Readiness probe: ¿puedo recibir tráfico?
   * Chequea Postgres y Redis. Si alguno falla, devuelve 503.
   * Usado por orquestadores para decidir si enviar tráfico.
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (DB + Redis)' })
  @ApiResponse({ status: 200, description: 'Listo para recibir tráfico' })
  @ApiResponse({ status: 503, description: 'Servicio no disponible' })
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('database', this.prismaService),
      () =>
        this.microserviceIndicator.pingCheck('redis', {
          transport: Transport.REDIS,
          options: {
            host: this.configService.get('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT'),
          },
        }),
    ]);
  }

  /**
   * Health check completo: estado de toda la infraestructura.
   * Usado para dashboards, monitoreo y debug manual.
   */
  @Get()
  @ApiOperation({ summary: 'Health check completo' })
  @ApiResponse({ status: 200, description: 'Todo OK' })
  @ApiResponse({ status: 503, description: 'Alguna dependencia caída' })
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.prismaIndicator.pingCheck('database', this.prismaService),
      () =>
        this.microserviceIndicator.pingCheck('redis', {
          transport: Transport.REDIS,
          options: {
            host: this.configService.get('REDIS_HOST'),
            port: this.configService.get<number>('REDIS_PORT'),
          },
        }),
    ]);
  }
}