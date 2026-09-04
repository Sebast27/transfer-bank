import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TransferController } from '../controllers/transfer.controller';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { PrismaTransactionRepository } from '../../infrastructure/adapters/prisma/transaction.repository.prisma';
import { TRANSACTION_REPOSITORY } from '../../core/domain/ports/transaction-repository.port';
import { TRANSACTION_SERVICE } from '../../core/application/ports/transaction-service.port';
import { ProcessTransferUseCase } from '../../core/application/use-cases/process-transfer.use-case';
import { BullMQModule } from '../../infrastructure/adapters/bullmq/bullmq.module';
import { HealthController } from '../controllers/health.controller';
import { AccountController } from '../controllers/account.controller';

@Module({
  imports: [
    // Configuración de variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Configuración de BullMQ (Redis)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    BullMQModule,
  ],
  controllers: [HealthController, TransferController, AccountController],
  providers: [
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
    {
      provide: TRANSACTION_SERVICE,
      useClass: ProcessTransferUseCase,
    },
  ],
})
export class AppModule {}