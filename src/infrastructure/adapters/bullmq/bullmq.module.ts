import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullMQQueueAdapter } from './queue.adapter';
import { TransferProcessor } from './transfer.processor';
import { QUEUE_PORT } from '../../../core/application/ports/queue.port';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transfer-queue',
    }),
  ],
  providers: [
    TransferProcessor,
    {
      provide: QUEUE_PORT,
      useClass: BullMQQueueAdapter,
    },
  ],
  exports: [QUEUE_PORT],
})
export class BullMQModule {}