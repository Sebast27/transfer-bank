import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class RequestStatementDto {
  @ApiProperty({ example: 'ACC-001', description: 'Account number' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiProperty({ example: '2024-01-01', description: 'Start date of the period' })
  @IsDateString()
  @IsNotEmpty()
  periodStart!: string;

  @ApiProperty({ example: '2024-01-31', description: 'End date of the period' })
  @IsDateString()
  @IsNotEmpty()
  periodEnd!: string;
}