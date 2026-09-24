import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../domain/ports/account-repository.port';
import { UpdateAccountStatusDto } from '../dto/update-account-status.dto';
import { IUpdateAccountStatusUseCase } from '../ports/update-account-status.port';

@Injectable()
export class UpdateAccountStatusUseCase implements IUpdateAccountStatusUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository
  ) { }

  async execute(accountNumber: string, dto: UpdateAccountStatusDto) {
    // 1. Find account
    const account = await this.accountRepository.findByNumber(accountNumber);

    if (!account) {
      throw new NotFoundException(`Account ${accountNumber} not found`);
    }

    // 2. Update status
    const updatedAccount = await this.accountRepository.updateStatus(accountNumber, dto.status);

    return {
      accountNumber: updatedAccount.accountNumber,
      status: updatedAccount.status,
      updatedAt: updatedAccount.updatedAt,
    };
  }
}