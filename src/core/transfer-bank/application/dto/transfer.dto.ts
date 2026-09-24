import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 'ACC-001', description: 'From account' })
  @IsString()
  fromAccount!: string;

  @ApiProperty({ example: 'ACC-002', description: 'To account' })
  @IsString()
  toAccount!: string;

  @ApiProperty({ example: 100, description: 'Amount to transfer' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 'Service Payment', description: 'Reference of the transfer', required: false })
  @IsString()
  @IsOptional()
  reference?: string;
}