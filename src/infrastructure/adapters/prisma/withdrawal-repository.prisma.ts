import { Injectable } from '@nestjs/common';
import { IWithdrawalRepository } from '../../../core/transfer-bank/domain/ports/withdrawal-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaWithdrawalRepository implements IWithdrawalRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findById(id: string): Promise<any | null> {
    return this.prisma.withdrawal.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.prisma.withdrawal.update({
      where: { id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  }
}