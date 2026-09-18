import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { User } from '../decorators/user.decorator';
import { IRequestDepositUseCase, REQUEST_DEPOSIT_USE_CASE } from '../../core/transfer-bank/application/ports/request-deposit.port';
import { IApproveDepositUseCase, APPROVE_DEPOSIT_USE_CASE } from '../../core/transfer-bank/application/ports/approve-deposit.port';
import { IDepositRepository, DEPOSIT_REPOSITORY } from '../../core/transfer-bank/domain/ports/deposit-repository.port';
import { RequestDepositDto } from '../../core/transfer-bank/application/dto/request-deposit.dto';

@ApiTags('deposits')
@ApiBearerAuth('JWT-auth')
@Controller('deposits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepositController {
  constructor(
    @Inject(REQUEST_DEPOSIT_USE_CASE)
    private readonly requestDepositUseCase: IRequestDepositUseCase,
    @Inject(APPROVE_DEPOSIT_USE_CASE)
    private readonly approveDepositUseCase: IApproveDepositUseCase,
    @Inject(DEPOSIT_REPOSITORY)
    private readonly depositRepository: IDepositRepository,
  ) {}

  // ============================================
  // USER ENDPOINTS
  // ============================================

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicitar un depósito (USER)' })
  @ApiResponse({ status: 202, description: 'Depósito solicitado, pendiente de aprobación' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async requestDeposit(@Body() dto: RequestDepositDto, @User() user: any) {
    console.log(`User ${user.email} requested deposit for ${dto.accountNumber}`);
    return this.requestDepositUseCase.execute(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar estado de un depósito' })
  @ApiResponse({ status: 200, description: 'Estado del depósito' })
  @ApiResponse({ status: 404, description: 'Depósito no encontrado' })
  async getDepositStatus(@Param('id') id: string, @User() user: any) {
    const deposit = await this.depositRepository.findById(id);

    if (!deposit) {
      throw new NotFoundException('Deposit not found');
    }

    return deposit;
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Get('admin/pending')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Listar depósitos pendientes (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de depósitos pendientes' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  async getPendingDeposits(@User() user: any) {
    console.log(`Admin ${user.email} checking pending deposits`);
    return this.depositRepository.findPending();
  }

  @Post(':id/approve')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar un depósito (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Depósito aprobado' })
  @ApiResponse({ status: 400, description: 'Depósito no está pendiente' })
  @ApiResponse({ status: 403, description: 'Acceso denegado' })
  @ApiResponse({ status: 404, description: 'Depósito no encontrado' })
  async approveDeposit(@Param('id') id: string, @User() user: any) {
    console.log(`Admin ${user.email} approving deposit ${id}`);
    return this.approveDepositUseCase.execute(id, user.id);
  }
}