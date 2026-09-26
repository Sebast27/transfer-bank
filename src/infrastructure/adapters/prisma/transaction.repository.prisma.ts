import { Injectable } from '@nestjs/common';
import { Transaction } from '../../../core/transfer-bank/domain/entities/transaction.entity';
import { ITransactionRepository } from '../../../core/transfer-bank/domain/ports/transaction-repository.port';
import { Money } from '../../../core/transfer-bank/domain/value-objects/money.vo';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaService) { }

  async save(transaction: Transaction): Promise<Transaction> {
    const fromAccount = await this.prisma.account.findUnique({
      where: { accountNumber: transaction.fromAccount },
    });

    const toAccount = await this.prisma.account.findUnique({
      where: { accountNumber: transaction.toAccount },
    });

    if (!fromAccount) {
      throw new Error(`Cuenta origen ${transaction.fromAccount} no encontrada`);
    }

    if (!toAccount) {
      throw new Error(`Cuenta destino ${transaction.toAccount} no encontrada`);
    }

    const result = await this.prisma.transaction.create({
      data: {
        id: transaction.id,
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount: transaction.amount.getValue(),
        status: transaction.status,
        reference: transaction.reference,
        attempts: 0,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt,
      },
    });

    return new Transaction({
      id: result.id,
      fromAccount: transaction.fromAccount,
      toAccount: transaction.toAccount,
      amount: new Money(result.amount),
      status: result.status as any,
      reference: result.reference || undefined,
      createdAt: result.createdAt,
      completedAt: result.completedAt || undefined,
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    const result = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });

    if (!result) return null;

    return new Transaction({
      id: result.id,
      fromAccount: result.fromAccount.accountNumber,
      toAccount: result.toAccount.accountNumber,
      amount: new Money(result.amount),
      status: result.status as any,
      reference: result.reference || undefined,
      createdAt: result.createdAt,
      completedAt: result.completedAt || undefined,
    });
  }

  async updateStatus(id: string, status: string): Promise<Transaction> {
    const result = await this.prisma.transaction.update({
      where: { id },
      data: { status },
      include: {
        fromAccount: true,
        toAccount: true,
      },
    });

    return new Transaction({
      id: result.id,
      fromAccount: result.fromAccount.accountNumber,
      toAccount: result.toAccount.accountNumber,
      amount: new Money(result.amount),
      status: result.status as any,
      reference: result.reference || undefined,
      createdAt: result.createdAt,
      completedAt: result.completedAt || undefined,
    });
  }

  async completeTransfer(
    transactionId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // 1. Debit source account
      await tx.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: amount } },
      });

      // 2. Credit destination account
      await tx.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: amount } },
      });

      // 3. Complete transaction
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    });
  }

  async markAsFailed(transactionId: string): Promise<void> {
    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'FAILED',
        attempts: { increment: 1 },
      },
    });
  }
}