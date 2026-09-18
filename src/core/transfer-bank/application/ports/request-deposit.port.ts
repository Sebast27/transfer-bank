import { RequestDepositDto } from '../dto/request-deposit.dto';

export const REQUEST_DEPOSIT_USE_CASE = 'REQUEST_DEPOSIT_USE_CASE';

export interface IRequestDepositUseCase {
  execute(dto: RequestDepositDto, userId: string): Promise<{
    depositId: string;
    status: string;
    accountNumber: string;
    amount: number;
  }>;
}