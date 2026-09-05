import { IsString, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class TransferDto {
  @IsString()
  fromAccount!: string;

  @IsString()
  toAccount!: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  amount!: number;

  @IsString()
  @IsOptional()
  reference?: string;
}