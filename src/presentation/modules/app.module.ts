import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, minutes, seconds } from '@nestjs/throttler';
import { BullMQModule } from '../../infrastructure/adapters/bullmq/bullmq.module';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { HealthController } from '../controllers/health.controller';
import { AdminModule } from './admin.module';
import { AuthModule } from './auth.module';
import { DepositModule } from './deposit.module';
import { StatementModule } from './statement.module';
import { TransferModule } from './transfer.module';
import { WithdrawalModule } from './withdrawal.module';

@Module({
  imports: [
    // Environment variable configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate limiting: 3 niveles (short/medium/long)
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: seconds(1),
        limit: 3,
      },
      {
        name: 'medium',
        ttl: seconds(10),
        limit: 20,
      },
      {
        name: 'long',
        ttl: minutes(1),
        limit: 100,
      },
    ]),
    // BullMQ (Redis) Configuration
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
    AuthModule,
    AdminModule,
    TransferModule,
    StatementModule,
    DepositModule,
    WithdrawalModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }