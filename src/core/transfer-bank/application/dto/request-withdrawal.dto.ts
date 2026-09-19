import { IsString, IsNumber, IsOptional, IsPositive, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestWithdrawalDto {
  @ApiProperty({ example: 'ACC-001', description: 'Número de cuenta' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiProperty({ example: 200, description: 'Monto a retirar' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 'Retiro en cajero', description: 'Referencia' })
  @IsString()
  @IsOptional()
  reference?: string;
}