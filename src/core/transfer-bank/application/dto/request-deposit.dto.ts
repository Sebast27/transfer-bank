import { IsString, IsNumber, IsOptional, IsPositive, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RequestDepositDto {
  @ApiProperty({ example: 'ACC-001', description: 'Número de cuenta' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiProperty({ example: 500, description: 'Monto a depositar' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 'Depósito en efectivo', description: 'Referencia' })
  @IsString()
  @IsOptional()
  reference?: string;
}