import { CreateAccountDto } from '../dto/create-account.dto';

export const CREATE_ACCOUNT_USE_CASE = 'CREATE_ACCOUNT_USE_CASE';

export interface ICreateAccountUseCase {
  execute(dto: CreateAccountDto): Promise<{
    id: string;
    accountNumber: string;
    balance: number;
    owner: {
      email: string;
      name: string;
    };
  }>;
}