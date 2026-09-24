import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../../core/auth/domain/ports/user-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) { }

  async findAll() {
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

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByIdSimple(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      password?: string;
      role?: string;
      isActive?: boolean;
    },
  ) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.password !== undefined && { password: data.password }),
        ...(data.role !== undefined && { role: data.role as any }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}