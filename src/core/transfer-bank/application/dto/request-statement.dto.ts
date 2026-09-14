import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class RequestStatementDto {
  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @IsDateString()
  @IsNotEmpty()
  periodStart!: string;

  @IsDateString()
  @IsNotEmpty()
  periodEnd!: string;
}