import { Injectable } from '@nestjs/common';
import { IAccountRepository } from '../../../core/transfer-bank/domain/ports/account-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaAccountRepository implements IAccountRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findByNumber(accountNumber: string) {
    const account = await this.prisma.account.findUnique({
      where: { accountNumber },
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        status: true,
        userId: true,
      },
    });

    return account;
  }

  async findByNumberWithUser(accountNumber: string) {
    const account = await this.prisma.account.findUnique({
      where: { accountNumber },
      select: {
        id: true,
        accountNumber: true,
        balance: true,
        status: true,
        userId: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return account;
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }

  async create(data: {
    accountNumber: string;
    balance: number;
    userId: string;
  }) {
    const account = await this.prisma.account.create({
      data: {
        accountNumber: data.accountNumber,
        balance: data.balance,
        userId: data.userId,
      },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    return {
      id: account.id,
      accountNumber: account.accountNumber,
      balance: account.balance,
      owner: {
        email: account.user.email,
        name: account.user.name,
      },
    };
  }

  async updateStatus(accountNumber: string, status: string) {
    const updated = await this.prisma.account.update({
      where: { accountNumber },
      data: { status },
      select: {
        accountNumber: true,
        status: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}