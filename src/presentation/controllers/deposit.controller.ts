import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RequestDepositDto } from '../../core/transfer-bank/application/dto/request-deposit.dto';
import { APPROVE_DEPOSIT_USE_CASE, IApproveDepositUseCase } from '../../core/transfer-bank/application/ports/approve-deposit.port';
import { GET_DEPOSIT_STATUS_USE_CASE, IGetDepositStatusUseCase } from '../../core/transfer-bank/application/ports/get-deposit-status.port';
import { GET_PENDING_DEPOSITS_USE_CASE, IGetPendingDepositsUseCase } from '../../core/transfer-bank/application/ports/get-pending-deposits.port';
import { IRequestDepositUseCase, REQUEST_DEPOSIT_USE_CASE } from '../../core/transfer-bank/application/ports/request-deposit.port';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthenticatedUser } from '../types/authenticated-user.type';

@ApiTags('deposits')
@ApiBearerAuth('JWT-auth')
@Controller('deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepositController {
  private readonly logger = new Logger(DepositController.name);

  constructor(
    @Inject(REQUEST_DEPOSIT_USE_CASE)
    private readonly requestDepositUseCase: IRequestDepositUseCase,
    @Inject(APPROVE_DEPOSIT_USE_CASE)
    private readonly approveDepositUseCase: IApproveDepositUseCase,
    @Inject(GET_DEPOSIT_STATUS_USE_CASE)
    private readonly getDepositStatusUseCase: IGetDepositStatusUseCase,
    @Inject(GET_PENDING_DEPOSITS_USE_CASE)
    private readonly getPendingDepositsUseCase: IGetPendingDepositsUseCase,
  ) { }

  // ============================================
  // USER ENDPOINTS
  // ============================================

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicitar un depósito (USER)' })
  @ApiResponse({ status: 202, description: 'Depósito solicitado, pendiente de aprobación' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async requestDeposit(
    @Body() dto: RequestDepositDto,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log(`Usuario ${user.email} depósito solicitado para ${dto.accountNumber}`);
    return this.requestDepositUseCase.execute(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar estado de un depósito' })
  @ApiResponse({ status: 200, description: 'Estado del depósito' })
  @ApiResponse({ status: 404, description: 'Depósito no encontrado' })
  async getDepositStatus(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log('Consultando estado de deposito');
    return this.getDepositStatusUseCase.execute(id, user.id, user.role);
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get('admin/pending')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar depósitos pendientes (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de depósitos pendientes' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async getPendingDeposits(@User() user: AuthenticatedUser) {
    this.logger.log(`Admin ${user.email} checking pending deposits`);
    return this.getPendingDepositsUseCase.execute();
  }

  @Post(':id/approve')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar un depósito (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Depósito aprobado' })
  @ApiResponse({ status: 400, description: 'Depósito no está pendiente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Depósito no encontrado' })
  async approveDeposit(
    @Param('id') id: string,
    @User() user: AuthenticatedUser
  ) {
    this.logger.log(`Admin ${user.email} approving deposit ${id}`);
    return this.approveDepositUseCase.execute(id, user.id);
  }
}