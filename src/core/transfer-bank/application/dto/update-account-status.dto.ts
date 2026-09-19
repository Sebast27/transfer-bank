import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}

export class UpdateAccountStatusDto {
  @ApiProperty({ enum: AccountStatus, example: 'FROZEN', description: 'Estado de la cuenta' })
  @IsEnum(AccountStatus)
  @IsNotEmpty()
  status!: AccountStatus;
}