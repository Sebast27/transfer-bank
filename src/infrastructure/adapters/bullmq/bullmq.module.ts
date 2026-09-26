import { EMAIL_PORT } from '@/core/transfer-bank/application/ports/email.port';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PDF_GENERATOR_PORT } from '../../../core/transfer-bank/application/ports/pdf-generator.port';
import { QUEUE_PORT } from '../../../core/transfer-bank/application/ports/queue.port';
import { ACCOUNT_REPOSITORY } from '../../../core/transfer-bank/domain/ports/account-repository.port';
import { DEPOSIT_REPOSITORY } from '../../../core/transfer-bank/domain/ports/deposit-repository.port';
import { STATEMENT_REPOSITORY } from '../../../core/transfer-bank/domain/ports/statement-repository.port';
import { TRANSACTION_REPOSITORY } from '../../../core/transfer-bank/domain/ports/transaction-repository.port';
import { WITHDRAWAL_REPOSITORY } from '../../../core/transfer-bank/domain/ports/withdrawal-repository.port';
import { EmailAdapter } from '../email/email.adapter';
import { PdfKitAdapter } from '../pdf/pdfkit.adapter';
import { PrismaAccountRepository } from '../prisma/account-repository.prisma';
import { PrismaDepositRepository } from '../prisma/deposit-repository.prisma';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaStatementRepository } from '../prisma/statement-repository.prisma';
import { PrismaTransactionRepository } from '../prisma/transaction.repository.prisma';
import { PrismaWithdrawalRepository } from '../prisma/withdrawal-repository.prisma';
import { DepositProcessor } from './deposit.processor';
import { NotificationProcessor } from './notification.processor';
import { BullMQQueueAdapter } from './queue.adapter';
import { StatementProcessor } from './statement.processor';
import { TransferProcessor } from './transfer.processor';
import { WithdrawalProcessor } from './withdrawal.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { name: 'transfer-queue' },
      { name: 'statement-queue' },
      { name: 'notification-queue' },
      { name: 'deposit-queue' },
      { name: 'withdrawal-queue' },
    ),
  ],
  providers: [
    // Workers
    TransferProcessor,
    StatementProcessor,
    NotificationProcessor,
    DepositProcessor,
    WithdrawalProcessor,

    // Repositorios (adaptadores)
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: PrismaAccountRepository,
    },
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PrismaTransactionRepository,
    },
    {
      provide: STATEMENT_REPOSITORY,
      useClass: PrismaStatementRepository,
    },
    {
      provide: DEPOSIT_REPOSITORY,
      useClass: PrismaDepositRepository,
    },
    {
      provide: WITHDRAWAL_REPOSITORY,
      useClass: PrismaWithdrawalRepository,
    },

    // Puertos de servicios externos
    {
      provide: QUEUE_PORT,
      useClass: BullMQQueueAdapter,
    },
    {
      provide: PDF_GENERATOR_PORT,
      useClass: PdfKitAdapter,
    },
    {
      provide: EMAIL_PORT,
      useClass: EmailAdapter,
    },
  ],
  exports: [BullModule, QUEUE_PORT, PDF_GENERATOR_PORT, EMAIL_PORT],
})
export class BullMQModule { }