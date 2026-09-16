import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IQueuePort } from '../../../core/transfer-bank/application/ports/queue.port';

@Injectable()
export class BullMQQueueAdapter implements IQueuePort {
  constructor(
    @InjectQueue('transfer-queue') private readonly transferQueue: Queue,
    @InjectQueue('statement-queue') private readonly statementQueue: Queue,
    @InjectQueue('notification-queue') private readonly notificationQueue: Queue,
  ) {}

  async add(jobName: string, data: any): Promise<void> {
    // Route to correct queue based on jobName or data
    if (jobName === 'statement-queue') {
      await this.statementQueue.add('process-statement', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
    } else if (jobName === 'notification-queue') {
      await this.notificationQueue.add('send-notification', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
    } else {
      await this.transferQueue.add(jobName, data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
    }
  }
}