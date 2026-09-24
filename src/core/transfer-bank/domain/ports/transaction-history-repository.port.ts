export const TRANSACTION_HISTORY_REPOSITORY = 'TRANSACTION_HISTORY_REPOSITORY';

export interface TransactionHistoryItem {
    id: string;
    type: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    direction: 'DEBIT' | 'CREDIT';
    status: string;
    reference: string | null;
    date: Date;
    counterparty?: string;
}

export interface ITransactionHistoryRepository {
    findByAccountId(
        accountId: string,
        filters: {
            type?: string;
            fromDate?: Date;
            toDate?: Date;
        },
    ): Promise<TransactionHistoryItem[]>;
}