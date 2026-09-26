import { Injectable } from '@nestjs/common';
import { IStatementRepository } from '../../../core/transfer-bank/domain/ports/statement-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaStatementRepository implements IStatementRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: {
    accountId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<{ id: string; status: string }> {
    // 1. Find account by accountNumber to get the real ID
    const account = await this.prisma.account.findUnique({
      where: { accountNumber: data.accountId },
    });

    if (!account) {
      throw new Error(`Account ${data.accountId} not found`);
    }

    // 2. Create statement
    const statement = await this.prisma.statement.create({
      data: {
        accountId: account.id,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        status: 'PENDING',
      },
    });

    return {
      id: statement.id,
      status: statement.status,
    };
  }

  async findById(id: string): Promise<any | null> {
    const statement = await this.prisma.statement.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            accountNumber: true,
            userId: true,
          },
        },
      },
    });

    if (!statement) return null;

    return {
      id: statement.id,
      accountId: statement.accountId,
      accountNumber: statement.account.accountNumber,
      accountUserId: statement.account.userId,
      periodStart: statement.periodStart,
      periodEnd: statement.periodEnd,
      status: statement.status,
      filePath: statement.filePath,
      error: statement.error,
      createdAt: statement.createdAt,
      completedAt: statement.completedAt,
    };
  }

  async findByIdWithAccount(id: string) {
    const statement = await this.prisma.statement.findUnique({
      where: { id },
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

    if (!statement) return null;

    return {
      id: statement.id,
      accountId: statement.accountId,
      periodStart: statement.periodStart,
      periodEnd: statement.periodEnd,
      status: statement.status,
      filePath: statement.filePath,
      account: {
        id: statement.account.id,
        accountNumber: statement.account.accountNumber,
        balance: statement.account.balance,
        status: statement.account.status,
        user: {
          id: statement.account.user.id,
          email: statement.account.user.email,
          name: statement.account.user.name,
        },
        transactions: [
          ...statement.account.fromTransactions,
          ...statement.account.toTransactions,
        ].map((t) => ({
          id: t.id,
          fromAccountId: t.fromAccountId,
          toAccountId: t.toAccountId,
          amount: t.amount,
          status: t.status,
          reference: t.reference,
          createdAt: t.createdAt,
        })),
      },
    };
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.prisma.statement.update({
      where: { id },
      data: { status },
    });
  }

  async completeStatement(id: string, filePath: string): Promise<void> {
    await this.prisma.statement.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        filePath,
        completedAt: new Date(),
      },
    });
  }

  async markAsFailed(id: string, error: string): Promise<void> {
    await this.prisma.statement.update({
      where: { id },
      data: {
        status: 'FAILED',
        error,
      },
    });
  }
}