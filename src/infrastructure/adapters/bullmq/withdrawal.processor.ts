import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IQueuePort, QUEUE_PORT } from '../../../core/transfer-bank/application/ports/queue.port';
import { IWithdrawalRepository, WITHDRAWAL_REPOSITORY } from '../../../core/transfer-bank/domain/ports/withdrawal-repository.port';

@Processor('withdrawal-queue')
export class WithdrawalProcessor extends WorkerHost {
  private readonly logger = new Logger(WithdrawalProcessor.name);

  constructor(
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly withdrawalRepository: IWithdrawalRepository,
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
      const withdrawal = await this.withdrawalRepository.findByIdWithAccount(withdrawalId);

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
      await this.withdrawalRepository.completeWithdrawal(withdrawalId, accountId, amount);

      this.logger.log(`✅ Retiro completado: ${withdrawalId}`);

      // 4. Enqueue email notification
      await this.queuePort.add('notification-queue', {
        to: withdrawal.account.user.email,
        subject: 'Withdrawal completed',
        body: `Your retirement from $${amount} de la cuenta ${withdrawal.account.accountNumber} has been successfully completed.`,
        template: 'withdrawal-completed',
      });

      this.logger.log(`📧 Notificación encolada para: ${withdrawal.account.user.email}`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.withdrawalRepository.markAsFailed(withdrawalId);

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