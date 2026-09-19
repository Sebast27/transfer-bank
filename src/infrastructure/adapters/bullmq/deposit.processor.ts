import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IQueuePort, QUEUE_PORT } from '../../../core/transfer-bank/application/ports/queue.port';

@Processor('deposit-queue')
export class DepositProcessor extends WorkerHost {
  private readonly logger = new Logger(DepositProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(QUEUE_PORT)
    private readonly queuePort: IQueuePort,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { depositId, accountId, amount } = job.data;

    this.logger.log(`🔄 Procesando depósito: ${depositId}`);
    this.logger.log(`   Cuenta: ${accountId}`);
    this.logger.log(`   Monto: $${amount}`);

    try {
      // 1. Get deposit and account with user
      const deposit = await this.prisma.deposit.findUnique({
        where: { id: depositId },
        include: {
          account: {
            include: { user: true },
          },
        },
      });

      if (!deposit) {
        throw new Error(`Deposit ${depositId} not found`);
      }

      if (deposit.account.status !== 'ACTIVE') {
        throw new Error(`Account is ${deposit.account.status}`);
      }

      // 2. Update account balance (atomic)
      await this.prisma.$transaction(async (tx) => {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: amount } },
        });

        await tx.deposit.update({
          where: { id: depositId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      });

      this.logger.log(`✅ Depósito completado: ${depositId}`);

      // 3. Enqueue email notification
      await this.queuePort.add('notification-queue', {
        to: deposit.account.user.email,
        subject: 'Depósito completado',
        body: `Tu depósito de $${amount} en la cuenta ${deposit.account.accountNumber} ha sido completado exitosamente.`,
        template: 'deposit-completed',
      });

      this.logger.log(`📧 Notificación encolada para: ${deposit.account.user.email}`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.deposit.update({
        where: { id: depositId },
        data: {
          status: 'REJECTED',
        },
      });

      this.logger.error(`❌ Depósito fallido: ${depositId} - ${errorMessage}`);
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