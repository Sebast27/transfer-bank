import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../domain/ports/account-repository.port';
import { IGetAllAccountsUseCase } from '../ports/get-all-accounts.port';

@Injectable()
export class GetAllAccountsUseCase implements IGetAllAccountsUseCase {
    constructor(
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: IAccountRepository,
    ) { }

    async execute() {
        return this.accountRepository.findAll();
    }
}