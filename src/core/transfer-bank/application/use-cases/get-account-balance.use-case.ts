import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../domain/ports/account-repository.port';
import { IGetAccountBalanceUseCase } from '../ports/get-account-balance.port';


@Injectable()
export class GetAccountBalanceUseCase implements IGetAccountBalanceUseCase {
    constructor(
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: IAccountRepository,
    ) { }

    async execute(accountNumber: string, userId: string, userRole: string) {
        // 1. Find account
        const account = await this.accountRepository.findByNumber(accountNumber);

        if (!account) {
            throw new NotFoundException(`Account ${accountNumber} not found`);
        }

        // 2. Verify ownership or ADMIN
        if (account.userId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException('You do not have access to this account');
        }

        return {
            accountNumber: account.accountNumber,
            balance: account.balance,
            updatedAt: account.updatedAt,
        };
    }
}