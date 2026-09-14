import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IPdfGeneratorPort, PDF_GENERATOR_PORT } from '../../../core/transfer-bank/application/ports/pdf-generator.port';

@Processor('statement-queue')
export class StatementProcessor extends WorkerHost {
  private readonly logger = new Logger(StatementProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PDF_GENERATOR_PORT)
    private readonly pdfGenerator: IPdfGeneratorPort,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { statementId } = job.data;

    this.logger.log(`🔄 Procesando estado de cuenta: ${statementId}`);

    try {
      // 1. Update status to PROCESSING
      await this.prisma.statement.update({
        where: { id: statementId },
        data: { status: 'PROCESSING' },
      });

      // 2. Get statement data
      const statement = await this.prisma.statement.findUnique({
        where: { id: statementId },
        include: {
          account: {
            include: {
              user: true,
              fromTransactions: true,
              toTransactions: true,
            },
          },
        },
      });

      if (!statement) {
        throw new Error(`Statement ${statementId} not found`);
      }

      // 3. Get transactions in the period
      const transactions = [
        ...statement.account.fromTransactions,
        ...statement.account.toTransactions,
      ]
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

      // 5. Update statement with file path and status
      await this.prisma.statement.update({
        where: { id: statementId },
        data: {
          status: 'COMPLETED',
          filePath,
          completedAt: new Date(),
        },
      });

      this.logger.log(`✅ Estado de cuenta completado: ${statementId}`);

      return { success: true, filePath };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.statement.update({
        where: { id: statementId },
        data: {
          status: 'FAILED',
          error: errorMessage,
        },
      });

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