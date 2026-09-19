import { Injectable, NotFoundException } from '@nestjs/common';
import { IUpdateAccountStatusUseCase } from '../ports/update-account-status.port';
import { PrismaService } from '../../../../infrastructure/adapters/prisma/prisma.service';
import { UpdateAccountStatusDto } from '../dto/update-account-status.dto';

@Injectable()
export class UpdateAccountStatusUseCase implements IUpdateAccountStatusUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(accountNumber: string, dto: UpdateAccountStatusDto) {
    // 1. Find account
    const account = await this.prisma.account.findUnique({
      where: { accountNumber },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountNumber} not found`);
    }

    // 2. Update status
    const updatedAccount = await this.prisma.account.update({
      where: { accountNumber },
      data: { status: dto.status },
    });

    return {
      accountNumber: updatedAccount.accountNumber,
      status: updatedAccount.status,
      updatedAt: updatedAccount.updatedAt,
    };
  }
}