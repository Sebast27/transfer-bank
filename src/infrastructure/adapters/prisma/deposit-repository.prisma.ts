import { Injectable } from '@nestjs/common';
import { IDepositRepository } from '../../../core/transfer-bank/domain/ports/deposit-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaDepositRepository implements IDepositRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findById(id: string): Promise<any | null> {
    return this.prisma.deposit.findUnique({
      where: { id },
    });
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
}