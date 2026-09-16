import { Controller, Get, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { PrismaService } from '../../infrastructure/adapters/prisma/prisma.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // Doble guard: autenticación + roles
@Roles('ADMIN') // Solo ADMIN puede acceder
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get('transfers')
  @ApiOperation({ summary: 'Listar TODAS las transferencias (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de transferencias' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async getAllTransfers() {
    this.logger.log('🔍 Admin consultando TODAS las transferencias');

    const transfers = await this.prisma.transaction.findMany({
      include: {
        fromAccount: {
          select: { accountNumber: true },
        },
        toAccount: {
          select: { accountNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return transfers.map((t) => ({
      id: t.id,
      fromAccount: t.fromAccount.accountNumber,
      toAccount: t.toAccount.accountNumber,
      amount: t.amount,
      status: t.status,
      reference: t.reference,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    }));
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Listar TODAS las cuentas (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de cuentas' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async getAllAccounts() {
    this.logger.log('🔍 Admin consultando TODAS las cuentas');

    const accounts = await this.prisma.account.findMany({
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
      orderBy: { accountNumber: 'asc' },
    });

    return accounts.map((a) => ({
      accountNumber: a.accountNumber,
      balance: a.balance,
      owner: {
        email: a.user.email,
        name: a.user.name,
      },
      updatedAt: a.updatedAt,
    }));
  }
}