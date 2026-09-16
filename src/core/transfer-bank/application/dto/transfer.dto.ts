import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 'ACC-001', description: 'Cuenta origen' })
  @IsString()
  fromAccount!: string;

  @ApiProperty({ example: 'ACC-002', description: 'Cuenta destino' })
  @IsString()
  toAccount!: string;

  @ApiProperty({ example: 100, description: 'Monto a transferir' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'Pago de servicios', description: 'Referencia de la transferencia', required: false })
  @IsString()
  @IsOptional()
  reference?: string;
}