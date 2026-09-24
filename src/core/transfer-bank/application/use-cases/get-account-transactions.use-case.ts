import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../domain/ports/account-repository.port';
import { ITransactionHistoryRepository, TRANSACTION_HISTORY_REPOSITORY, TransactionHistoryItem } from '../../domain/ports/transaction-history-repository.port';
import { GetTransactionsQueryDto, TransactionType } from '../dto/get-transactions-query.dto';
import { IGetAccountTransactionsUseCase } from '../ports/get-account-transactions.port';

@Injectable()
export class GetAccountTransactionsUseCase implements IGetAccountTransactionsUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    @Inject(TRANSACTION_HISTORY_REPOSITORY)
    private readonly transactionHistoryRepository: ITransactionHistoryRepository,
  ) { }

  async execute(
    accountNumber: string,
    userId: string,
    filters: GetTransactionsQueryDto,
  ): Promise<TransactionHistoryItem[]> {
    // 1. Find account
    const account = await this.accountRepository.findByNumber(accountNumber);

    if (!account) {
      throw new NotFoundException(`Account ${accountNumber} not found`);
    }

    // 2. Verify ownership (only owner can see their transactions)
    if (account.userId !== userId) {
      throw new ForbiddenException('You do not have access to this account');
    }

    // 3. Get transactions using the port
    return this.transactionHistoryRepository.findByAccountId(account.id, {
      type: filters.type || TransactionType.ALL,
      fromDate: filters.fromDate ? new Date(filters.fromDate) : undefined,
      toDate: filters.toDate ? new Date(filters.toDate) : undefined,
    });
  }
}