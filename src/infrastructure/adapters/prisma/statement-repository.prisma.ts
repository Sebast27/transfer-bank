import { Injectable } from '@nestjs/common';
import { IStatementRepository } from '../../../core/transfer-bank/domain/ports/statement-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaStatementRepository implements IStatementRepository {
  constructor(private readonly prisma: PrismaService) {}

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
          select: { accountNumber: true },
        },
      },
    });

    if (!statement) return null;

    return {
      id: statement.id,
      accountNumber: statement.account.accountNumber,
      periodStart: statement.periodStart,
      periodEnd: statement.periodEnd,
      status: statement.status,
      filePath: statement.filePath,
      error: statement.error,
      createdAt: statement.createdAt,
      completedAt: statement.completedAt,
    };
  }
}