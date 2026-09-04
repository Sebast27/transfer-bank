import { Controller, Get, Param, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/adapters/prisma/prisma.service';

@Controller('accounts')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get(':accountNumber')
  async getBalance(@Param('accountNumber') accountNumber: string) {
    this.logger.log(`🔍 Consultando saldo de cuenta: ${accountNumber}`);

    const account = await this.prisma.account.findUnique({
      where: { accountNumber },
      select: {
        accountNumber: true,
        balance: true,
        updatedAt: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Cuenta ${accountNumber} no encontrada`);
    }

    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      updatedAt: account.updatedAt,
    };
  }
}