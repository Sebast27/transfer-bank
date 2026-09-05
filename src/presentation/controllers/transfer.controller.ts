import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { TransferDto } from '../../core/transfer-bank/application/dto/transfer.dto';
import { ITransactionService, TRANSACTION_SERVICE } from '../../core/transfer-bank/application/ports/transaction-service.port';

@Controller('transfers')
export class TransferController {
  constructor(
    @Inject(TRANSACTION_SERVICE)
    private readonly transactionService: ITransactionService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async transfer(@Body() dto: TransferDto) {
    const result = await this.transactionService.transfer(dto);
    return {
      message: 'Transferencia iniciada correctamente',
      transactionId: result.transactionId,
      status: result.status,
    };
  }

  @Get(':id')
  async getStatus(@Param('id') id: string) {
    return this.transactionService.getStatus(id);
  }
}