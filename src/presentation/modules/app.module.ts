import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { TransferController } from '../controllers/transfer.controller';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { PrismaTransactionRepository } from '../../infrastructure/adapters/prisma/transaction.repository.prisma';
import { TRANSACTION_REPOSITORY } from '../../core/transfer-bank/domain/ports/transaction-repository.port';
import { TRANSACTION_SERVICE } from '../../core/transfer-bank/application/ports/transaction-service.port';
import { ProcessTransferUseCase } from '../../core/transfer-bank/application/use-cases/process-transfer.use-case';
import { BullMQModule } from '../../infrastructure/adapters/bullmq/bullmq.module';
import { HealthController } from '../controllers/health.controller';
import { AccountController } from '../controllers/account.controller';
import { AuthModule } from './auth.module';
import { AuthController } from '../controllers/auth.controller';
import { AdminController } from '../controllers/admin.controller';
import { StatementModule } from './statement.module';
import { DepositModule } from './deposit.module';
import { WithdrawalModule } from './withdrawal.module';
import { CreateAccountUseCase } from '@/core/auth/application/use-cases/create-account.use-case';
import { CREATE_ACCOUNT_USE_CASE } from '@/core/auth/application/ports/create-account.port';
import { GET_USERS_USE_CASE } from '@/core/auth/application/ports/get-users.port';
import { GetUsersUseCase } from '@/core/auth/application/use-cases/get-users.use-case';
import { UPDATE_USER_USE_CASE } from '@/core/auth/application/ports/update-user.port';
import { UpdateUserUseCase } from '@/core/auth/application/use-cases/update-user.use-case';

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
    AuthModule,
    StatementModule,
    DepositModule,
    WithdrawalModule,
  ],
  controllers: [
    HealthController, 
    TransferController, 
    AccountController, 
    AuthController, 
    AdminController],
  providers: [
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
    {
      provide: TRANSACTION_SERVICE,
      useClass: ProcessTransferUseCase,
    },
    {
      provide: CREATE_ACCOUNT_USE_CASE,
      useClass: CreateAccountUseCase,
    },
    {
      provide: GET_USERS_USE_CASE,
      useClass: GetUsersUseCase,
    },
    {
      provide: UPDATE_USER_USE_CASE,
      useClass: UpdateUserUseCase,
    },
  ],
})
export class AppModule {}