import { RequestWithdrawalDto } from '../dto/request-withdrawal.dto';

export const REQUEST_WITHDRAWAL_USE_CASE = 'REQUEST_WITHDRAWAL_USE_CASE';

export interface IRequestWithdrawalUseCase {
  execute(dto: RequestWithdrawalDto, userId: string): Promise<{
    withdrawalId: string;
    status: string;
    accountNumber: string;
    amount: number;
  }>;
}