import { GetTransactionsQueryDto } from '../dto/get-transactions-query.dto';

export const GET_ACCOUNT_TRANSACTIONS_USE_CASE = 'GET_ACCOUNT_TRANSACTIONS_USE_CASE';

export interface TransactionHistoryItem {
  id: string;
  type: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL';
  amount: number;
  direction: 'DEBIT' | 'CREDIT';
  status: string;
  reference: string | null;
  date: Date;
  counterparty?: string; // Cuenta origen/destino para transferencias
}

export interface IGetAccountTransactionsUseCase {
  execute(
    accountNumber: string,
    userId: string,
    filters: GetTransactionsQueryDto,
  ): Promise<TransactionHistoryItem[]>;
}