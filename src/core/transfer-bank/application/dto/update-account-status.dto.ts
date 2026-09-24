import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}

export class UpdateAccountStatusDto {
  @ApiProperty({ enum: AccountStatus, example: 'FROZEN', description: 'Account status' })
  @IsEnum(AccountStatus)
  @IsNotEmpty()
  status!: AccountStatus;
}