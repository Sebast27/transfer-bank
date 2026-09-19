import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { IGetAccountTransactionsUseCase, TransactionHistoryItem } from '../ports/get-account-transactions.port';
import { PrismaService } from '../../../../infrastructure/adapters/prisma/prisma.service';
import { GetTransactionsQueryDto, TransactionType } from '../dto/get-transactions-query.dto';

@Injectable()
export class GetAccountTransactionsUseCase implements IGetAccountTransactionsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    accountNumber: string,
    userId: string,
    filters: GetTransactionsQueryDto,
  ): Promise<TransactionHistoryItem[]> {
    // 1. Find account
    const account = await this.prisma.account.findUnique({
      where: { accountNumber },
    });

    if (!account) {
      throw new NotFoundException(`Account ${accountNumber} not found`);
    }

    // 2. Verify ownership (only owner can see their transactions)
    if (account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this account');
    }

    // 3. Build date filter
    const dateFilter: any = {};
    if (filters.fromDate) {
      dateFilter.gte = new Date(filters.fromDate);
    }
    if (filters.toDate) {
      dateFilter.lte = new Date(filters.toDate);
    }

    const hasDateFilter = Object.keys(dateFilter).length > 0;

    // 4. Get transactions based on type filter
    const transactions: TransactionHistoryItem[] = [];
    const typeFilter = filters.type || TransactionType.ALL;

    // 4a. Transfers (as from or to)
    if (typeFilter === TransactionType.ALL || typeFilter === TransactionType.TRANSFER) {
      const transfers = await this.prisma.transaction.findMany({
        where: {
          OR: [
            { fromAccountId: account.id },
            { toAccountId: account.id },
          ],
          ...(hasDateFilter && { createdAt: dateFilter }),
        },
        include: {
          fromAccount: { select: { accountNumber: true } },
          toAccount: { select: { accountNumber: true } },
        },
      });

      transfers.forEach((t) => {
        const isDebit = t.fromAccountId === account.id;
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

    // 4b. Deposits
    if (typeFilter === TransactionType.ALL || typeFilter === TransactionType.DEPOSIT) {
      const deposits = await this.prisma.deposit.findMany({
        where: {
          accountId: account.id,
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

    // 4c. Withdrawals
    if (typeFilter === TransactionType.ALL || typeFilter === TransactionType.WITHDRAWAL) {
      const withdrawals = await this.prisma.withdrawal.findMany({
        where: {
          accountId: account.id,
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

    // 5. Sort by date (most recent first)
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    return transactions;
  }
}