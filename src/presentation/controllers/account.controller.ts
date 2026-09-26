import { Controller, Get, Inject, Logger, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetTransactionsQueryDto } from '../../core/transfer-bank/application/dto/get-transactions-query.dto';
import { GET_ACCOUNT_BALANCE_USE_CASE, IGetAccountBalanceUseCase } from '../../core/transfer-bank/application/ports/get-account-balance.port';
import { GET_ACCOUNT_TRANSACTIONS_USE_CASE, IGetAccountTransactionsUseCase } from '../../core/transfer-bank/application/ports/get-account-transactions.port';
import { User } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedUser } from '../types/authenticated-user.type';

@ApiTags('accounts')
@ApiBearerAuth('JWT-auth')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(
    @Inject(GET_ACCOUNT_BALANCE_USE_CASE)
    private readonly getAccountBalanceUseCase: IGetAccountBalanceUseCase,
    @Inject(GET_ACCOUNT_TRANSACTIONS_USE_CASE)
    private readonly getAccountTransactionsUseCase: IGetAccountTransactionsUseCase,
  ) { }

  @Get(':accountNumber')
  @ApiOperation({ summary: 'Consultar saldo de una cuenta' })
  @ApiParam({ name: 'accountNumber', example: 'ACC-001' })
  @ApiResponse({ status: 200, description: 'Saldo consultado' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getBalance(
    @Param('accountNumber') accountNumber: string,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log(`Checking account balance: ${accountNumber}`);
    this.getAccountBalanceUseCase.execute(accountNumber, user.id, user.role);
  }

  @Get(':accountNumber/transactions')
  @ApiOperation({ summary: 'Consultar historial de transacciones de una cuenta' })
  @ApiParam({ name: 'accountNumber', example: 'ACC-001' })
  @ApiResponse({ status: 200, description: 'Historial de transacciones' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  @ApiResponse({ status: 403, description: 'No tienes acceso a esta cuenta' })
  async getTransactions(
    @Param('accountNumber') accountNumber: string,
    @Query() filters: GetTransactionsQueryDto,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log(`🔍 Usuario ${user.email} consulta transacciones de: ${accountNumber}`);
    return this.getAccountTransactionsUseCase.execute(accountNumber, user.id, filters);
  }
}