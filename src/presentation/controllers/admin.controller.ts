import { Body, Controller, Get, Inject, Logger, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from '../../core/auth/application/dto/update-user.dto';
import { GET_USERS_USE_CASE, IGetUsersUseCase } from '../../core/auth/application/ports/get-users.port';
import { IUpdateUserUseCase, UPDATE_USER_USE_CASE } from '../../core/auth/application/ports/update-user.port';
import { CreateAccountDto } from '../../core/transfer-bank/application/dto/create-account.dto';
import { UpdateAccountStatusDto } from '../../core/transfer-bank/application/dto/update-account-status.dto';
import { CREATE_ACCOUNT_USE_CASE, ICreateAccountUseCase } from '../../core/transfer-bank/application/ports/create-account.port';
import { GET_ALL_ACCOUNTS_USE_CASE, IGetAllAccountsUseCase } from '../../core/transfer-bank/application/ports/get-all-accounts.port';
import { GET_ALL_TRANSFERS_USE_CASE, IGetAllTransfersUseCase } from '../../core/transfer-bank/application/ports/get-all-transfers.port';
import { IUpdateAccountStatusUseCase, UPDATE_ACCOUNT_STATUS_USE_CASE } from '../../core/transfer-bank/application/ports/update-account-status.port';
import { Roles } from '../decorators/roles.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

@ApiTags('admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // Double guard: authentication + roles
@Roles('ADMIN') // Only ADMIN can access
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    @Inject(GET_ALL_TRANSFERS_USE_CASE)
    private readonly getAllTransfersUseCase: IGetAllTransfersUseCase,
    @Inject(GET_ALL_ACCOUNTS_USE_CASE)
    private readonly getAllAccountsUseCase: IGetAllAccountsUseCase,
    @Inject(CREATE_ACCOUNT_USE_CASE)
    private readonly createAccountUseCase: ICreateAccountUseCase,
    @Inject(GET_USERS_USE_CASE)
    private readonly getUsersUseCase: IGetUsersUseCase,
    @Inject(UPDATE_USER_USE_CASE)
    private readonly updateUserUseCase: IUpdateUserUseCase,
    @Inject(UPDATE_ACCOUNT_STATUS_USE_CASE)
    private readonly updateAccountStatusUseCase: IUpdateAccountStatusUseCase,
  ) { }

  // ============================================
  // TRANSFERS
  // ============================================

  @Get('transfers')
  @ApiOperation({ summary: 'Listar TODAS las transferencias (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de transferencias' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async getAllTransfers() {
    this.logger.log('🔍 Admin consultando TODAS las transferencias');
    this.getAllTransfersUseCase.execute();
  }

  // ============================================
  // ACCOUNTS
  // ============================================

  @Get('accounts')
  @ApiOperation({ summary: 'Listar TODAS las cuentas (solo ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de cuentas' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async getAllAccounts() {
    this.logger.log('🔍 Admin consultando TODAS las cuentas');
    this.getAllAccountsUseCase.execute();
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Crear una nueva cuenta (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Cuenta creada' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Cuenta ya existe' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async createAccount(@Body() dto: CreateAccountDto) {
    this.logger.log(`🔍 Admin creando cuenta ${dto.accountNumber} para ${dto.userEmail}`);
    return this.createAccountUseCase.execute(dto);
  }

  @Patch('accounts/:accountNumber/status')
  @ApiOperation({ summary: 'Congelar/Descongelar/Cerrar una cuenta (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Estado actualizado' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async updateAccountStatus(
    @Param('accountNumber') accountNumber: string,
    @Body() dto: UpdateAccountStatusDto,
  ) {
    this.logger.log(`🔍 Admin actualizando estado de cuenta ${accountNumber} a ${dto.status}`);
    return this.updateAccountStatusUseCase.execute(accountNumber, dto);
  }

  // ============================================
  // USERS
  // ============================================

  @Get('users')
  @ApiOperation({ summary: 'Listar TODOS los usuarios con sus cuentas (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async getAllUsers() {
    this.logger.log('🔍 Admin consultando TODOS los usuarios');
    return this.getUsersUseCase.execute();
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Actualizar un usuario (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    this.logger.log(`🔍 Admin actualizando usuario ${id}`);
    return this.updateUserUseCase.execute(id, dto);
  }
}