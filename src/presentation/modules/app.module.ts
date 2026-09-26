import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
  providers: [],
})
export class AppModule { }