import { UpdateAccountStatusDto } from '../dto/update-account-status.dto';

export const UPDATE_ACCOUNT_STATUS_USE_CASE = 'UPDATE_ACCOUNT_STATUS_USE_CASE';

export interface IUpdateAccountStatusUseCase {
  execute(accountNumber: string, dto: UpdateAccountStatusDto): Promise<{
    accountNumber: string;
    status: string;
    updatedAt: Date;
  }>;
}