import { GET_USERS_USE_CASE } from '@/core/auth/application/ports/get-users.port';
import { UPDATE_USER_USE_CASE } from '@/core/auth/application/ports/update-user.port';
import { GetUsersUseCase } from '@/core/auth/application/use-cases/get-users.use-case';
import { UpdateUserUseCase } from '@/core/auth/application/use-cases/update-user.use-case';
import { CREATE_ACCOUNT_USE_CASE } from '@/core/transfer-bank/application/ports/create-account.port';
import { GET_ACCOUNT_BALANCE_USE_CASE } from '@/core/transfer-bank/application/ports/get-account-balance.port';
import { GET_ACCOUNT_TRANSACTIONS_USE_CASE } from '@/core/transfer-bank/application/ports/get-account-transactions.port';
import { GET_ALL_ACCOUNTS_USE_CASE } from '@/core/transfer-bank/application/ports/get-all-accounts.port';
import { GET_ALL_TRANSFERS_USE_CASE } from '@/core/transfer-bank/application/ports/get-all-transfers.port';
import { GET_DEPOSIT_STATUS_USE_CASE } from '@/core/transfer-bank/application/ports/get-deposit-status.port';
import { GET_PENDING_DEPOSITS_USE_CASE } from '@/core/transfer-bank/application/ports/get-pending-deposits.port';
import { UPDATE_ACCOUNT_STATUS_USE_CASE } from '@/core/transfer-bank/application/ports/update-account-status.port';
import { CreateAccountUseCase } from '@/core/transfer-bank/application/use-cases/create-account.use-case';
import { GetAccountBalanceUseCase } from '@/core/transfer-bank/application/use-cases/get-account-balance.use-case';
import { GetAccountTransactionsUseCase } from '@/core/transfer-bank/application/use-cases/get-account-transactions.use-case';
import { GetAllAccountsUseCase } from '@/core/transfer-bank/application/use-cases/get-all-accounts.use-case';
import { GetAllTransfersUseCase } from '@/core/transfer-bank/application/use-cases/get-all-transfers.use-case';
import { GetDepositStatusUseCase } from '@/core/transfer-bank/application/use-cases/get-deposit-status.use-case';
import { GetPendingDepositsUseCase } from '@/core/transfer-bank/application/use-cases/get-pending-deposits.use-case';
import { UpdateAccountStatusUseCase } from '@/core/transfer-bank/application/use-cases/update-account-status.use-case';
import { ACCOUNT_REPOSITORY } from '@/core/transfer-bank/domain/ports/account-repository.port';
import { TRANSACTION_HISTORY_REPOSITORY } from '@/core/transfer-bank/domain/ports/transaction-history-repository.port';
import { PrismaAccountRepository } from '@/infrastructure/adapters/prisma/account-repository.prisma';
import { PrismaTransactionHistoryRepository } from '@/infrastructure/adapters/prisma/transaction-history-repository.prisma';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TRANSACTION_SERVICE } from '../../core/transfer-bank/application/ports/transaction-service.port';
import { ProcessTransferUseCase } from '../../core/transfer-bank/application/use-cases/process-transfer.use-case';
import { TRANSACTION_REPOSITORY } from '../../core/transfer-bank/domain/ports/transaction-repository.port';
import { BullMQModule } from '../../infrastructure/adapters/bullmq/bullmq.module';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { PrismaTransactionRepository } from '../../infrastructure/adapters/prisma/transaction.repository.prisma';
import { AccountController } from '../controllers/account.controller';
import { AdminController } from '../controllers/admin.controller';
import { AuthController } from '../controllers/auth.controller';
import { HealthController } from '../controllers/health.controller';
import { TransferController } from '../controllers/transfer.controller';
import { AuthModule } from './auth.module';
import { DepositModule } from './deposit.module';
import { StatementModule } from './statement.module';
import { WithdrawalModule } from './withdrawal.module';

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
      provide: TRANSACTION_HISTORY_REPOSITORY,
      useClass: PrismaTransactionHistoryRepository,
    },
    {
      provide: TRANSACTION_SERVICE,
      useClass: ProcessTransferUseCase,
    },
    {
      provide: GET_ACCOUNT_BALANCE_USE_CASE,
      useClass: GetAccountBalanceUseCase,
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
      provide: GET_DEPOSIT_STATUS_USE_CASE,
      useClass: GetDepositStatusUseCase,
    },
    {
      provide: GET_PENDING_DEPOSITS_USE_CASE,
      useClass: GetPendingDepositsUseCase,
    },
    {
      provide: GET_ALL_TRANSFERS_USE_CASE,
      useClass: GetAllTransfersUseCase,
    },
    {
      provide: GET_ALL_ACCOUNTS_USE_CASE,
      useClass: GetAllAccountsUseCase,
    },
    {
      provide: UPDATE_USER_USE_CASE,
      useClass: UpdateUserUseCase,
    },
    {
      provide: UPDATE_ACCOUNT_STATUS_USE_CASE,
      useClass: UpdateAccountStatusUseCase,
    },
    {
      provide: GET_ACCOUNT_TRANSACTIONS_USE_CASE,
      useClass: GetAccountTransactionsUseCase,
    },
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: PrismaAccountRepository,
    },
  ],
})
export class AppModule { }