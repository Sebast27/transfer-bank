import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ACCOUNT_REPOSITORY, IAccountRepository } from '../../domain/ports/account-repository.port';
import { IWithdrawalRepository, WITHDRAWAL_REPOSITORY } from '../../domain/ports/withdrawal-repository.port';
import { RequestWithdrawalDto } from '../dto/request-withdrawal.dto';
import { IQueuePort, QUEUE_PORT } from '../ports/queue.port';
import { IRequestWithdrawalUseCase } from '../ports/request-withdrawal.port';

@Injectable()
export class RequestWithdrawalUseCase implements IRequestWithdrawalUseCase {
  constructor(
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly withdrawalRepository: IWithdrawalRepository,
    @Inject(QUEUE_PORT)
    private readonly queuePort: IQueuePort,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository
  ) { }

  async execute(dto: RequestWithdrawalDto, userId: string) {
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

    // 3. Verify sufficient balance
    if (account.balance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Current balance: $${account.balance}`,
      );
    }

    // 4. Create withdrawal (PENDING)
    const withdrawal = await this.withdrawalRepository.create({
      accountId: account.id,
      amount: dto.amount,
      reference: dto.reference,
    });

    // 5. Enqueue for processing
    await this.queuePort.add('withdrawal-queue', {
      withdrawalId: withdrawal.id,
      accountId: account.id,
      amount: dto.amount,
    });

    return {
      withdrawalId: withdrawal.id,
      status: withdrawal.status,
      accountNumber: dto.accountNumber,
      amount: withdrawal.amount,
    };
  }
}