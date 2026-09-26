import { Injectable } from '@nestjs/common';
import { IDepositRepository } from '../../../core/transfer-bank/domain/ports/deposit-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaDepositRepository implements IDepositRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: {
    accountId: string;
    amount: number;
    requestedBy: string;
    reference?: string;
  }): Promise<{ id: string; status: string; amount: number }> {
    const deposit = await this.prisma.deposit.create({
      data: {
        accountId: data.accountId,
        amount: data.amount,
        status: 'PENDING',
        requestedBy: data.requestedBy,
        reference: data.reference,
      },
    });

    return {
      id: deposit.id,
      status: deposit.status,
      amount: deposit.amount,
    };
  }

  async findById(id: string) {
    const deposit = await this.prisma.deposit.findUnique({
      where: { id },
      include: {
        account: {
          include: { user: true },
        },
      },
    });

    if (!deposit) return null;

    return {
      id: deposit.id,
      accountId: deposit.accountId,
      amount: deposit.amount,
      status: deposit.status,
      requestedBy: deposit.requestedBy,
      approvedBy: deposit.approvedBy,
      reference: deposit.reference,
      createdAt: deposit.createdAt,
      approvedAt: deposit.approvedAt,
      completedAt: deposit.completedAt,
      account: {
        id: deposit.account.id,
        accountNumber: deposit.account.accountNumber,
        balance: deposit.account.balance,
        status: deposit.account.status,
        user: {
          id: deposit.account.user.id,
          email: deposit.account.user.email,
          name: deposit.account.user.name,
        },
      },
    };
  }

  async updateStatus(id: string, status: string, approvedBy?: string): Promise<void> {
    await this.prisma.deposit.update({
      where: { id },
      data: {
        status,
        approvedBy,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  async findPending(): Promise<any[]> {
    return this.prisma.deposit.findMany({
      where: { status: 'PENDING' },
      include: {
        account: {
          select: { accountNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async completeDeposit(depositId: string, accountId: string, amount: number): Promise<void> {
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
  }
}