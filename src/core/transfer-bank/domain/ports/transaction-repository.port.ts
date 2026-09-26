import { Transaction } from '../entities/transaction.entity';

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  updateStatus(id: string, status: string): Promise<Transaction>;

  findAll(): Promise<Array<{
    id: string;
    fromAccount: string;
    toAccount: string;
    amount: number;
    status: string;
    reference: string | null;
    createdAt: Date;
    completedAt: Date | null;
  }>>;

  completeTransfer(
    transactionId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number,
  ): Promise<void>;

  markAsFailed(transactionId: string): Promise<void>;
}