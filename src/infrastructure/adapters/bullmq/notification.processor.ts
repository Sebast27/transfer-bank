import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { IEmailPort, EMAIL_PORT } from '../../../core/transfer-bank/application/ports/email.port';

@Processor('notification-queue')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @Inject(EMAIL_PORT)
    private readonly emailPort: IEmailPort,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { to, subject, body, template } = job.data;

    this.logger.log(`🔄 Procesando notificación para: ${to}`);

    try {
      await this.emailPort.sendEmail({ to, subject, body, template });
      this.logger.log(`✅ Notificación enviada a: ${to}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Error enviando notificación a ${to}: ${errorMessage}`);
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`🎉 Job ${job.id} completado con éxito`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`💥 Job ${job.id} falló: ${error.message}`);
  }
}