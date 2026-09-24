import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class RequestDepositDto {
  @ApiProperty({ example: 'ACC-001', description: 'Account number' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiProperty({ example: 500, description: 'Amount to deposit' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 'Cash Deposit', description: 'Reference' })
  @IsString()
  @IsOptional()
  reference?: string;
}