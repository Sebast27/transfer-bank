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
import { User } from '../decorators/user.decorator';
import { IRequestWithdrawalUseCase, REQUEST_WITHDRAWAL_USE_CASE } from '../../core/transfer-bank/application/ports/request-withdrawal.port';
import { IWithdrawalRepository, WITHDRAWAL_REPOSITORY } from '../../core/transfer-bank/domain/ports/withdrawal-repository.port';
import { RequestWithdrawalDto } from '../../core/transfer-bank/application/dto/request-withdrawal.dto';

@ApiTags('withdrawals')
@ApiBearerAuth('JWT-auth')
@Controller('withdrawals')
@UseGuards(JwtAuthGuard)
export class WithdrawalController {
  constructor(
    @Inject(REQUEST_WITHDRAWAL_USE_CASE)
    private readonly requestWithdrawalUseCase: IRequestWithdrawalUseCase,
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly withdrawalRepository: IWithdrawalRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Solicitar un retiro (USER)' })
  @ApiResponse({ status: 202, description: 'Retiro iniciado' })
  @ApiResponse({ status: 400, description: 'Saldo insuficiente' })
  @ApiResponse({ status: 404, description: 'Cuenta no encontrada' })
  async requestWithdrawal(@Body() dto: RequestWithdrawalDto, @User() user: any) {
    console.log(`User ${user.email} requested withdrawal from ${dto.accountNumber}`);
    return this.requestWithdrawalUseCase.execute(dto, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar estado de un retiro' })
  @ApiResponse({ status: 200, description: 'Estado del retiro' })
  @ApiResponse({ status: 404, description: 'Retiro no encontrado' })
  async getWithdrawalStatus(@Param('id') id: string, @User() user: any) {
    const withdrawal = await this.withdrawalRepository.findById(id);

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    return withdrawal;
  }
}