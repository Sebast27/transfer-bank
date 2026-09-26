import { Injectable } from '@nestjs/common';
import { IWithdrawalRepository } from '../../../core/transfer-bank/domain/ports/withdrawal-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaWithdrawalRepository implements IWithdrawalRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(data: {
    accountId: string;
    amount: number;
    reference?: string;
  }): Promise<{ id: string; status: string; amount: number }> {
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        accountId: data.accountId,
        amount: data.amount,
        status: 'PENDING',
        reference: data.reference,
      },
    });

    return {
      id: withdrawal.id,
      status: withdrawal.status,
      amount: withdrawal.amount,
    };
  }

  async findById(id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: {
        account: {
          select: { userId: true },
        },
      },
    });

    if (!withdrawal) return null;

    return {
      id: withdrawal.id,
      accountId: withdrawal.accountId,
      amount: withdrawal.amount,
      status: withdrawal.status,
      reference: withdrawal.reference,
      createdAt: withdrawal.createdAt,
      completedAt: withdrawal.completedAt,
      accountUserId: withdrawal.account.userId,
    };
  }

  async findByIdWithAccount(id: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id },
      include: {
        account: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!withdrawal) return null;

    return {
      id: withdrawal.id,
      accountId: withdrawal.accountId,
      amount: withdrawal.amount,
      status: withdrawal.status,
      reference: withdrawal.reference,
      createdAt: withdrawal.createdAt,
      completedAt: withdrawal.completedAt,
      account: {
        id: withdrawal.account.id,
        accountNumber: withdrawal.account.accountNumber,
        balance: withdrawal.account.balance,
        status: withdrawal.account.status,
        user: {
          id: withdrawal.account.user.id,
          email: withdrawal.account.user.email,
          name: withdrawal.account.user.name,
        },
      },
    };
  }

  async updateStatus(id: string, status: string) {
    await this.prisma.withdrawal.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }

  async completeWithdrawal(withdrawalId: string, accountId: string, amount: number): Promise<void> {
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
  }

  async markAsFailed(withdrawalId: string): Promise<void> {
    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'FAILED' },
    });
  }
}