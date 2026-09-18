import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TransferProcessor } from './transfer.processor';
import { StatementProcessor } from './statement.processor';
import { NotificationProcessor } from './notification.processor';
import { BullMQQueueAdapter } from './queue.adapter';
import { QUEUE_PORT } from '../../../core/transfer-bank/application/ports/queue.port';
import { PDF_GENERATOR_PORT } from '../../../core/transfer-bank/application/ports/pdf-generator.port';
import { PdfKitAdapter } from '../pdf/pdfkit.adapter';
import { EmailAdapter } from '../email/email.adapter';
import { EMAIL_PORT } from '@/core/transfer-bank/application/ports/email.port';
import { DepositProcessor } from './deposit.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'transfer-queue' },
      { name: 'statement-queue' },
      { name: 'notification-queue' },
      { name: 'deposit-queue' },
    ),
  ],
  providers: [
    TransferProcessor,
    StatementProcessor,
    NotificationProcessor,
    DepositProcessor,
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
export class BullMQModule {}