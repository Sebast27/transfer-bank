import { Injectable } from '@nestjs/common';
import { ITransactionHistoryRepository, TransactionHistoryItem } from '../../../core/transfer-bank/domain/ports/transaction-history-repository.port';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaTransactionHistoryRepository implements ITransactionHistoryRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByAccountId(
        accountId: string,
        filters: {
            type?: string;
            fromDate?: Date;
            toDate?: Date;
        },
    ): Promise<TransactionHistoryItem[]> {
        const transactions: TransactionHistoryItem[] = [];

        // Build date filter
        const dateFilter: any = {};
        if (filters.fromDate) {
            dateFilter.gte = filters.fromDate;
        }
        if (filters.toDate) {
            dateFilter.lte = filters.toDate;
        }
        const hasDateFilter = Object.keys(dateFilter).length > 0;

        const typeFilter = filters.type || 'ALL';

        // 1. Transfers
        if (typeFilter === 'ALL' || typeFilter === 'TRANSFER') {
            const transfers = await this.prisma.transaction.findMany({
                where: {
                    OR: [
                        { fromAccountId: accountId },
                        { toAccountId: accountId },
                    ],
                    ...(hasDateFilter && { createdAt: dateFilter }),
                },
                include: {
                    fromAccount: { select: { accountNumber: true } },
                    toAccount: { select: { accountNumber: true } },
                },
            });

            transfers.forEach((t) => {
                const isDebit = t.fromAccountId === accountId;
                transactions.push({
                    id: t.id,
                    type: 'TRANSFER',
                    amount: t.amount,
                    direction: isDebit ? 'DEBIT' : 'CREDIT',
                    status: t.status,
                    reference: t.reference,
                    date: t.createdAt,
                    counterparty: isDebit
                        ? t.toAccount.accountNumber
                        : t.fromAccount.accountNumber,
                });
            });
        }

        // 2. Deposits
        if (typeFilter === 'ALL' || typeFilter === 'DEPOSIT') {
            const deposits = await this.prisma.deposit.findMany({
                where: {
                    accountId,
                    ...(hasDateFilter && { createdAt: dateFilter }),
                },
            });

            deposits.forEach((d) => {
                transactions.push({
                    id: d.id,
                    type: 'DEPOSIT',
                    amount: d.amount,
                    direction: 'CREDIT',
                    status: d.status,
                    reference: d.reference,
                    date: d.createdAt,
                });
            });
        }

        // 3. Withdrawals
        if (typeFilter === 'ALL' || typeFilter === 'WITHDRAWAL') {
            const withdrawals = await this.prisma.withdrawal.findMany({
                where: {
                    accountId,
                    ...(hasDateFilter && { createdAt: dateFilter }),
                },
            });

            withdrawals.forEach((w) => {
                transactions.push({
                    id: w.id,
                    type: 'WITHDRAWAL',
                    amount: w.amount,
                    direction: 'DEBIT',
                    status: w.status,
                    reference: w.reference,
                    date: w.createdAt,
                });
            });
        }

        // 4. Sort by date (most recent first)
        transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

        return transactions;
    }
}