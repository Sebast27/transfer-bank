import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class RequestStatementDto {
  @ApiProperty({ example: 'ACC-001', description: 'Número de cuenta' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiProperty({ example: '2024-01-01', description: 'Fecha de inicio del período' })
  @IsDateString()
  @IsNotEmpty()
  periodStart!: string;

  @ApiProperty({ example: '2024-01-31', description: 'Fecha de fin del período' })
  @IsDateString()
  @IsNotEmpty()
  periodEnd!: string;
}