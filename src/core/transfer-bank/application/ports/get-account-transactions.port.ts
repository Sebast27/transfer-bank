import { TransactionHistoryItem } from '../../domain/ports/transaction-history-repository.port';
import { GetTransactionsQueryDto } from '../dto/get-transactions-query.dto';

export const GET_ACCOUNT_TRANSACTIONS_USE_CASE = 'GET_ACCOUNT_TRANSACTIONS_USE_CASE';

export interface IGetAccountTransactionsUseCase {
  execute(
    accountNumber: string,
    userId: string,
    filters: GetTransactionsQueryDto,
  ): Promise<TransactionHistoryItem[]>;
}