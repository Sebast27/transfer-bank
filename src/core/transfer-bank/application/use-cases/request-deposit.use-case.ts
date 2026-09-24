import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../domain/ports/account-repository.port';
import { DEPOSIT_REPOSITORY, IDepositRepository } from '../../domain/ports/deposit-repository.port';
import { RequestDepositDto } from '../dto/request-deposit.dto';
import { IRequestDepositUseCase } from '../ports/request-deposit.port';

@Injectable()
export class RequestDepositUseCase implements IRequestDepositUseCase {
  constructor(
    @Inject(DEPOSIT_REPOSITORY)
    private readonly depositRepository: IDepositRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository
  ) { }

  async execute(dto: RequestDepositDto, userId: string) {
    // 1. Find account
    const account = await this.accountRepository.findByNumber(dto.accountNumber);

    if (!account) {
      throw new NotFoundException(`Account ${dto.accountNumber} not found`);
    }

    if (account.status !== 'ACTIVE') {
      throw new BadRequestException(`Account is ${account.status}`);
    }

    // 2. Verify account belongs to user
    if (account.userId !== userId) {
      throw new NotFoundException(`Account ${dto.accountNumber} does not belong to you`);
    }

    // 3. Create deposit (PENDING)
    const deposit = await this.depositRepository.create({
      accountId: account.id,
      amount: dto.amount,
      requestedBy: userId,
      reference: dto.reference,
    });

    return {
      depositId: deposit.id,
      status: deposit.status,
      accountNumber: dto.accountNumber,
      amount: deposit.amount,
    };
  }
}