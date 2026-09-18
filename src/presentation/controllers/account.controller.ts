import { Controller, Get, Param, NotFoundException, Logger, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/adapters/prisma/prisma.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get(':accountNumber')
  @ApiOperation({ summary: 'Consultar saldo de una cuenta' })
  @ApiParam({ name: 'accountNumber', example: 'ACC-001' })
  @ApiResponse({ status: 200, description: 'Saldo consultado' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
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
    if (account.userId !== user.id && user.role !== 'ADMIN') {
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