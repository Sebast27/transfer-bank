import { Module } from '@nestjs/common';
import { GET_ACCOUNT_BALANCE_USE_CASE } from '../../core/transfer-bank/application/ports/get-account-balance.port';
import { GET_ACCOUNT_TRANSACTIONS_USE_CASE } from '../../core/transfer-bank/application/ports/get-account-transactions.port';
import { TRANSACTION_SERVICE } from '../../core/transfer-bank/application/ports/transaction-service.port';
import { GetAccountBalanceUseCase } from '../../core/transfer-bank/application/use-cases/get-account-balance.use-case';
import { GetAccountTransactionsUseCase } from '../../core/transfer-bank/application/use-cases/get-account-transactions.use-case';
import { ProcessTransferUseCase } from '../../core/transfer-bank/application/use-cases/process-transfer.use-case';
import { ACCOUNT_REPOSITORY } from '../../core/transfer-bank/domain/ports/account-repository.port';
import { TRANSACTION_HISTORY_REPOSITORY } from '../../core/transfer-bank/domain/ports/transaction-history-repository.port';
import { TRANSACTION_REPOSITORY } from '../../core/transfer-bank/domain/ports/transaction-repository.port';
import { BullMQModule } from '../../infrastructure/adapters/bullmq/bullmq.module';
import { PrismaAccountRepository } from '../../infrastructure/adapters/prisma/account-repository.prisma';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { PrismaTransactionHistoryRepository } from '../../infrastructure/adapters/prisma/transaction-history-repository.prisma';
import { PrismaTransactionRepository } from '../../infrastructure/adapters/prisma/transaction.repository.prisma';
import { AccountController } from '../controllers/account.controller';
import { TransferController } from '../controllers/transfer.controller';

@Module({
    imports: [PrismaModule, BullMQModule],
    controllers: [TransferController, AccountController],
    providers: [
        // Repositories
        { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
        { provide: TRANSACTION_REPOSITORY, useClass: PrismaTransactionRepository },
        { provide: TRANSACTION_HISTORY_REPOSITORY, useClass: PrismaTransactionHistoryRepository },
        // Use cases
        { provide: TRANSACTION_SERVICE, useClass: ProcessTransferUseCase },
        { provide: GET_ACCOUNT_BALANCE_USE_CASE, useClass: GetAccountBalanceUseCase },
        { provide: GET_ACCOUNT_TRANSACTIONS_USE_CASE, useClass: GetAccountTransactionsUseCase },
    ],
})
export class TransferModule { }