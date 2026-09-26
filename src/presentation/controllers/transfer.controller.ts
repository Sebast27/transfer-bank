import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransferDto } from '../../core/transfer-bank/application/dto/transfer.dto';
import { GET_TRANSFER_STATUS_USE_CASE, IGetTransferStatusUseCase } from '../../core/transfer-bank/application/ports/get-transfer-status.port';
import { IProcessTransferUseCase, PROCESS_TRANSFER_USE_CASE } from '../../core/transfer-bank/application/ports/process-transfer.port';
import { User } from '../decorators/user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AuthenticatedUser } from '../types/authenticated-user.type';

@ApiTags('transfers')
@ApiBearerAuth('JWT-auth')
@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransferController {
  private readonly logger = new Logger(TransferController.name);

  constructor(
    @Inject(PROCESS_TRANSFER_USE_CASE)
    private readonly processTransferUseCase: IProcessTransferUseCase,
    @Inject(GET_TRANSFER_STATUS_USE_CASE)
    private readonly getTransferStatusUseCase: IGetTransferStatusUseCase,
  ) { }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Crear una transferencia (asíncrona)' })
  @ApiResponse({ status: 202, description: 'Transferencia iniciada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async transfer(
    @Body() dto: TransferDto,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log(`User ${user.email} is creating a transfer`);
    const result = await this.processTransferUseCase.execute(dto);
    return {
      message: 'Transfer initiated successfully',
      transactionId: result.transactionId,
      status: result.status,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar estado de una transferencia' })
  @ApiResponse({ status: 200, description: 'Estado de la transferencia' })
  @ApiResponse({ status: 404, description: 'Transferencia no encontrada' })
  async getStatus(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ) {
    this.logger.log(`User ${user.email} is checking the status of transfer ${id}`);
    return this.getTransferStatusUseCase.execute(id);
  }
}