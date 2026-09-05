import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IQueuePort, QUEUE_PORT } from '../../../core/transfer-bank/application/ports/queue.port';

@Injectable()
export class BullMQQueueAdapter implements IQueuePort {
  constructor(@InjectQueue('transfer-queue') private readonly queue: Queue) {}

  async add(jobName: string, data: any): Promise<void> {
    await this.queue.add(jobName, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}