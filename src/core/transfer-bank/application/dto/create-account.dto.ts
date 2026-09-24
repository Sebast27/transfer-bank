import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({ example: 'user@test.com', description: 'User email' })
  @IsString()
  @IsNotEmpty()
  userEmail!: string;

  @ApiProperty({ example: 'ACC-004', description: 'Account number' })
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @ApiPropertyOptional({ example: 0, description: 'Initial balance', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  initialBalance?: number;
}