import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TransferProcessor } from './transfer.processor';
import { StatementProcessor } from './statement.processor';
import { BullMQQueueAdapter } from './queue.adapter';
import { QUEUE_PORT } from '../../../core/transfer-bank/application/ports/queue.port';
import { PDF_GENERATOR_PORT } from '../../../core/transfer-bank/application/ports/pdf-generator.port';
import { PdfKitAdapter } from '../pdf/pdfkit.adapter';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'transfer-queue' },
      { name: 'statement-queue' },
    ),
  ],
  providers: [
    TransferProcessor,
    StatementProcessor,
    {
      provide: QUEUE_PORT,
      useClass: BullMQQueueAdapter,
    },
    {
      provide: PDF_GENERATOR_PORT,
      useClass: PdfKitAdapter,
    },
  ],
  exports: [BullModule, QUEUE_PORT, PDF_GENERATOR_PORT],
})
export class BullMQModule {}