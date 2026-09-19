import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType {
  ALL = 'ALL',
  TRANSFER = 'TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

export class GetTransactionsQueryDto {
  @ApiPropertyOptional({ enum: TransactionType, example: 'ALL', description: 'Tipo de transacción' })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '2026-09-01', description: 'Fecha de inicio' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'Fecha de fin' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}