import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum TransactionType {
  ALL = 'ALL',
  TRANSFER = 'TRANSFER',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
}

export class GetTransactionsQueryDto {
  @ApiPropertyOptional({ enum: TransactionType, example: 'ALL', description: 'Type of transaction' })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ example: '2026-09-01', description: 'Start date' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ example: '2026-09-30', description: 'End date' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}