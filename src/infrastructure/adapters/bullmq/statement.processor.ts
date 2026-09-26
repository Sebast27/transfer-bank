import { IQueuePort, QUEUE_PORT } from '@/core/transfer-bank/application/ports/queue.port';
import { IStatementRepository, STATEMENT_REPOSITORY } from '@/core/transfer-bank/domain/ports/statement-repository.port';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { IPdfGeneratorPort, PDF_GENERATOR_PORT } from '../../../core/transfer-bank/application/ports/pdf-generator.port';

@Processor('statement-queue')
export class StatementProcessor extends WorkerHost {
  private readonly logger = new Logger(StatementProcessor.name);

  constructor(
    @Inject(STATEMENT_REPOSITORY)
    private readonly statementRepository: IStatementRepository,
    @Inject(PDF_GENERATOR_PORT)
    private readonly pdfGenerator: IPdfGeneratorPort,
    @Inject(QUEUE_PORT)
    private readonly queuePort: IQueuePort,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { statementId } = job.data;

    this.logger.log(`: ${statementId}`);

    try {
      // 1. Update status to PROCESSING
      await this.statementRepository.updateStatus(statementId, 'PROCESSING');

      // 2. Get statement with account data
      const statement = await this.statementRepository.findByIdWithAccount(statementId);

      if (!statement) {
        throw new Error(`Statement ${statementId} not found`);
      }

      // 3. Filter transactions in the period
      const transactions = statement.account.transactions
        .filter(
          (t) =>
            t.createdAt >= statement.periodStart &&
            t.createdAt <= statement.periodEnd,
        )
        .map((t) => ({
          date: t.createdAt,
          type: t.fromAccountId === statement.account.id ? 'DEBIT' : 'CREDIT',
          amount: t.amount,
          balance: statement.account.balance,
          description: t.reference || 'Transferencia',
        }));

      // 4. Generate PDF
      const filePath = await this.pdfGenerator.generateStatement({
        accountNumber: statement.account.accountNumber,
        ownerName: statement.account.user.name,
        balance: statement.account.balance,
        periodStart: statement.periodStart,
        periodEnd: statement.periodEnd,
        transactions,
      });

      // 5. Complete statement
      await this.statementRepository.completeStatement(statementId, filePath);

      this.logger.log(`✅ Estado de cuenta completado: ${statementId}`);

      // 6. Enqueue email notification
      await this.queuePort.add('notification-queue', {
        to: statement.account.user.email,
        subject: 'Account statement available',
        body: `Your account statement for ${statement.account.accountNumber} It's ready. You can download it from the app.`,
        template: 'statement-ready',
      });

      this.logger.log(`📧 Notificación encolada para: ${statement.account.user.email}`);

      return { success: true, filePath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.statementRepository.markAsFailed(statementId, errorMessage);

      this.logger.error(`❌ Estado de cuenta fallido: ${statementId} - ${errorMessage}`);
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