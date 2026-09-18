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
    @InjectQueue('deposit-queue') private readonly depositQueue: Queue,
  ) {}

  async add(jobName: string, data: any): Promise<void> {
    const options = {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    };

    // Route to correct queue based on jobName or data
    if (jobName === 'statement-queue') {
      await this.statementQueue.add('process-statement', data, options);
    } else if (jobName === 'notification-queue') {
      await this.notificationQueue.add('send-notification', data, options);
    } else if (jobName === 'deposit-queue') {
      await this.depositQueue.add('process-deposit', data, options);
    } else {
      await this.transferQueue.add(jobName, data, options);
    }
  }
}