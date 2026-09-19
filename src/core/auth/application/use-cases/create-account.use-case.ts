import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { ICreateAccountUseCase } from '../ports/create-account.port';
import { PrismaService } from '../../../../infrastructure/adapters/prisma/prisma.service';
import { CreateAccountDto } from '../dto/create-account.dto';

@Injectable()
export class CreateAccountUseCase implements ICreateAccountUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: CreateAccountDto) {
    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.userEmail },
    });

    if (!user) {
      throw new NotFoundException(`User ${dto.userEmail} not found`);
    }

    // 2. Check if account number already exists
    const existingAccount = await this.prisma.account.findUnique({
      where: { accountNumber: dto.accountNumber },
    });

    if (existingAccount) {
      throw new ConflictException(`Account ${dto.accountNumber} already exists`);
    }

    // 3. Create account
    const account = await this.prisma.account.create({
      data: {
        accountNumber: dto.accountNumber,
        balance: dto.initialBalance || 0,
        userId: user.id,
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
}