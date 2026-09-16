import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Inject, UseGuards } from '@nestjs/common';
import { TransferDto } from '../../core/transfer-bank/application/dto/transfer.dto';
import { ITransactionService, TRANSACTION_SERVICE } from '../../core/transfer-bank/application/ports/transaction-service.port';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('transfers')
@ApiBearerAuth('JWT-auth')
@Controller('transfers')
@UseGuards(JwtAuthGuard)
export class TransferController {
  constructor(
    @Inject(TRANSACTION_SERVICE)
    private readonly transactionService: ITransactionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Crear una transferencia (asíncrona)' })
  @ApiResponse({ status: 202, description: 'Transferencia iniciada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async transfer(
    @Body() dto: TransferDto,
    @User() user: any,
  ) {
    // Asociar la transferencia al usuario autenticado
    console.log(`User ${user.email} is creating a transfer`);

    const result = await this.transactionService.transfer(dto);
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
    @User() user: any,
  ) {
    // Asociar la consulta de estado al usuario autenticado
    console.log(`User ${user.email} is checking the status of transfer ${id}`);
    
    return this.transactionService.getStatus(id);
  }
}