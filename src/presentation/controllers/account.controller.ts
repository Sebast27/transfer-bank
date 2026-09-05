import { Controller, Get, Param, NotFoundException, Logger, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/adapters/prisma/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get(':accountNumber')
  async getBalance(
    @Param('accountNumber') accountNumber: string,
    @User() user: any,
  ) {
    this.logger.log(`Checking account balance: ${accountNumber}`);

    const account = await this.prisma.account.findUnique({
      where: { accountNumber },
      select: {
        accountNumber: true,
        balance: true,
        updatedAt: true,
        userId: true,
      },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountNumber} not found`);
    }

    // Verificar que la cuenta pertenece al usuario autenticado
    if (account.userId !== user.id) {
      this.logger.warn(`⚠️ User ${user.email} tried to access another user's account`);
      throw new NotFoundException(`Account ${accountNumber} not found`);
    }

    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      updatedAt: account.updatedAt,
    };
  }
}