import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IQueuePort, QUEUE_PORT } from '../../../core/transfer-bank/application/ports/queue.port';

@Processor('withdrawal-queue')
export class WithdrawalProcessor extends WorkerHost {
  private readonly logger = new Logger(WithdrawalProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(QUEUE_PORT)
    private readonly queuePort: IQueuePort,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { withdrawalId, accountId, amount } = job.data;

    this.logger.log(`🔄 Procesando retiro: ${withdrawalId}`);
    this.logger.log(`   Cuenta: ${accountId}`);
    this.logger.log(`   Monto: $${amount}`);

    try {
      // 1. Get withdrawal and account with user
      const withdrawal = await this.prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
        include: {
          account: {
            include: { user: true },
          },
        },
      });

      if (!withdrawal) {
        throw new Error(`Withdrawal ${withdrawalId} not found`);
      }

      if (withdrawal.account.status !== 'ACTIVE') {
        throw new Error(`Account is ${withdrawal.account.status}`);
      }

      // 2. Verify sufficient balance again (safety check)
      if (withdrawal.account.balance < amount) {
        throw new Error(`Insufficient balance. Current: $${withdrawal.account.balance}`);
      }

      // 3. Update account balance (atomic)
      await this.prisma.$transaction(async (tx) => {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: amount } },
        });

        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      });

      this.logger.log(`✅ Retiro completado: ${withdrawalId}`);

      // 4. Enqueue email notification
      await this.queuePort.add('notification-queue', {
        to: withdrawal.account.user.email,
        subject: 'Retiro completado',
        body: `Tu retiro de $${amount} de la cuenta ${withdrawal.account.accountNumber} ha sido completado exitosamente.`,
        template: 'withdrawal-completed',
      });

      this.logger.log(`📧 Notificación encolada para: ${withdrawal.account.user.email}`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status: 'FAILED',
        },
      });

      this.logger.error(`❌ Retiro fallido: ${withdrawalId} - ${errorMessage}`);
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