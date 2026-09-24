import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../domain/ports/account-repository.port';
import { CreateAccountDto } from '../dto/create-account.dto';
import { ICreateAccountUseCase } from '../ports/create-account.port';

@Injectable()
export class CreateAccountUseCase implements ICreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository
  ) { }

  async execute(dto: CreateAccountDto) {
    // 1. Find user by email
    const user = await this.accountRepository.findUserByEmail(dto.userEmail);

    if (!user) {
      throw new NotFoundException(`User ${dto.userEmail} not found`);
    }

    // 2. Check if account number already exists
    const existingAccount = await this.accountRepository.findByNumber(dto.accountNumber);

    if (existingAccount) {
      throw new ConflictException(`Account ${dto.accountNumber} already exists`);
    }

    // 3. Create account
    const account = await this.accountRepository.create({
      accountNumber: dto.accountNumber,
      balance: dto.initialBalance || 0,
      userId: user.id,
    });

    return account;
  }
}