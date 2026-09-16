import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IQueuePort } from '../../../core/transfer-bank/application/ports/queue.port';

@Processor('transfer-queue')
export class TransferProcessor extends WorkerHost {
  private readonly logger = new Logger(TransferProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
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
      // 1. Buscar cuentas
      const fromAccount = await this.prisma.account.findUnique({
        where: { accountNumber: fromAccountNumber },
        include: { user: true },
      });

      const toAccount = await this.prisma.account.findUnique({
        where: { accountNumber: toAccountNumber },
        include: { user: true },
      });

      if (!fromAccount) {
        throw new Error(`Cuenta origen ${fromAccountNumber} no encontrada`);
      }

      if (!toAccount) {
        throw new Error(`Cuenta destino ${toAccountNumber} no encontrada`);
      }

      // 2. Validar saldo
      if (fromAccount.balance < amount) {
        throw new Error(`Saldo insuficiente en ${fromAccountNumber}`);
      }

      // 3. Ejecutar transferencia (operación atómica)
      await this.prisma.$transaction(async (tx) => {
        // ACTUALIZAR SALDO ORIGEN
        await tx.account.update({
          where: { id: fromAccount.id },
          data: { balance: { decrement: amount } },
        });

        // ACTUALIZAR SALDO DESTINO
        await tx.account.update({
          where: { id: toAccount.id },
          data: { balance: { increment: amount } },
        });

        // COMPLETAR TRANSACCIÓN
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      });

      this.logger.log(`✅ Transferencia completada: ${transactionId}`);
      this.logger.log(`   Nuevo saldo origen: $${fromAccount.balance - amount}`);
      this.logger.log(`   Nuevo saldo destino: $${toAccount.balance + amount}`);

      // Enqueue email notification
      await this.queuePort.add('notification-queue', {
        to: fromAccount.user.email,
        subject: 'Transferencia completada',
        body: `Tu transferencia de $${amount} a ${toAccountNumber} ha sido completada exitosamente.`,
        template: 'transfer-completed',
      });

      this.logger.log(`📧 Notificación encolada para: ${fromAccount.user.email}`);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`❌ Transferencia fallida: ${transactionId} - ${errorMessage}`);

      await this.prisma.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          attempts: { increment: 1 },
        },
      });

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