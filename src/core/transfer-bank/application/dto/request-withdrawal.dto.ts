import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class RequestWithdrawalDto {
  @ApiProperty({ example: 'ACC-001', description: 'Account number' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiProperty({ example: 200, description: 'Amount to withdraw' })
  @IsNumber()
  @IsPositive()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ example: 'Cash Withdrawal', description: 'Reference' })
  @IsString()
  @IsOptional()
  reference?: string;
}