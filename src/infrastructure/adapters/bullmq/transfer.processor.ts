import { ACCOUNT_REPOSITORY, IAccountRepository } from '@/core/transfer-bank/domain/ports/account-repository.port';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '@/core/transfer-bank/domain/ports/transaction-repository.port';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IQueuePort } from '../../../core/transfer-bank/application/ports/queue.port';

@Processor('transfer-queue')
export class TransferProcessor extends WorkerHost {
  private readonly logger = new Logger(TransferProcessor.name);

  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject('QUEUE_PORT')
    private readonly queuePort: IQueuePort,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { transactionId, fromAccountNumber, toAccountNumber, amount } = job.data;

    this.logger.log(`🔄 Procesando transferencia: ${transactionId}`);
    this.logger.log(`   Desde: ${fromAccountNumber} → Hacia: ${toAccountNumber}`);
    this.logger.log(`   Monto: $${amount}`);

    try {
      // 1. Search for accounts
      const fromAccount = await this.accountRepository.findByNumberWithUser(fromAccountNumber);
      const toAccount = await this.accountRepository.findByNumberWithUser(toAccountNumber);

      if (!fromAccount) {
        throw new Error(`Source account ${fromAccountNumber} not found`);
      }

      if (!toAccount) {
        throw new Error(`Destination account ${toAccountNumber} not found`);
      }

      if (fromAccount.status !== 'ACTIVE') {
        throw new Error(`Source account is ${fromAccount.status}`);
      }

      if (toAccount.status !== 'ACTIVE') {
        throw new Error(`The destination account is ${toAccount.status}`);
      }

      // 2. Validate balance
      if (fromAccount.balance < amount) {
        throw new Error(`Insufficient balance in ${fromAccountNumber}`);
      }

      // 3. Execute transfer (atomic operation)
      await this.transactionRepository.completeTransfer(
        transactionId,
        fromAccount.id,
        toAccount.id,
        amount,
      );

      this.logger.log(`✅ Transferencia completada: ${transactionId}`);
      this.logger.log(`   Nuevo saldo origen: $${fromAccount.balance - amount}`);
      this.logger.log(`   Nuevo saldo destino: $${toAccount.balance + amount}`);

      // Enqueue email notification
      await this.queuePort.add('notification-queue', {
        to: fromAccount.user.email,
        subject: 'Transfer completed',
        body: `Your transfer of $${amount} a ${toAccountNumber} has been successfully completed.`,
        template: 'transfer-completed',
      });

      this.logger.log(`📧 Notificación en cola para: ${fromAccount.user.email}`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Transfer failed: ${transactionId} - ${errorMessage}`);

      await this.transactionRepository.markAsFailed(transactionId);

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