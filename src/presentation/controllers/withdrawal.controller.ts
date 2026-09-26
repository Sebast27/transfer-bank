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
import { RequestWithdrawalDto } from '../../core/transfer-bank/application/dto/request-withdrawal.dto';
import { GET_WITHDRAWAL_STATUS_USE_CASE, IGetWithdrawalStatusUseCase } from '../../core/transfer-bank/application/ports/get-withdrawal-status.port';
import { IRequestWithdrawalUseCase, REQUEST_WITHDRAWAL_USE_CASE } from '../../core/transfer-bank/application/ports/request-withdrawal.port';
import { User } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedUser } from '../types/authenticated-user.type';

@ApiTags('withdrawals')
@ApiBearerAuth('JWT-auth')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalController {
  private readonly logger = new Logger(WithdrawalController.name);

  constructor(
    @Inject(REQUEST_WITHDRAWAL_USE_CASE)
    private readonly requestWithdrawalUseCase: IRequestWithdrawalUseCase,
    @Inject(GET_WITHDRAWAL_STATUS_USE_CASE)
    private readonly getWithdrawalStatusUseCase: IGetWithdrawalStatusUseCase,
  ) { }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicitar un retiro (USER)' })
  @ApiResponse({ status: 202, description: 'Retiro iniciado' })
  @ApiResponse({ status: 400, description: 'Saldo insuficiente' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async requestWithdrawal(
    @Body() dto: RequestWithdrawalDto,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log(`User ${user.email} requested withdrawal from ${dto.accountNumber}`);
    return this.requestWithdrawalUseCase.execute(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar estado de un retiro' })
  @ApiResponse({ status: 200, description: 'Estado del retiro' })
  @ApiResponse({ status: 404, description: 'Retiro no encontrado' })
  async getWithdrawalStatus(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log(`User ${user.email} checking withdrawal ${id}`);
    return this.getWithdrawalStatusUseCase.execute(id, user.id, user.role);
  }
}