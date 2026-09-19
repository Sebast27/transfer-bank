import { Injectable } from '@nestjs/common';
import { IGetUsersUseCase } from '../ports/get-users.port';
import { PrismaService } from '../../../../infrastructure/adapters/prisma/prisma.service';

@Injectable()
export class GetUsersUseCase implements IGetUsersUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute() {
    const users = await this.prisma.user.findMany({
      include: {
        accounts: {
          select: {
            accountNumber: true,
            balance: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      accounts: user.accounts.map((acc) => ({
        accountNumber: acc.accountNumber,
        balance: acc.balance,
      })),
    }));
  }
}