import { IsString, IsNumber, IsOptional, IsPositive, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAccountDto {
  @ApiProperty({ example: 'user@test.com', description: 'Email del usuario' })
  @IsString()
  @IsNotEmpty()
  userEmail!: string;

  @ApiProperty({ example: 'ACC-004', description: 'Número de cuenta' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiPropertyOptional({ example: 0, description: 'Saldo inicial', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  initialBalance?: number;
}