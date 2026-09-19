import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IRequestWithdrawalUseCase } from '../ports/request-withdrawal.port';
import { IWithdrawalRepository, WITHDRAWAL_REPOSITORY } from '../../domain/ports/withdrawal-repository.port';
import { IQueuePort, QUEUE_PORT } from '../ports/queue.port';
import { PrismaService } from '../../../../infrastructure/adapters/prisma/prisma.service';
import { RequestWithdrawalDto } from '../dto/request-withdrawal.dto';

@Injectable()
export class RequestWithdrawalUseCase implements IRequestWithdrawalUseCase {
  constructor(
    @Inject(WITHDRAWAL_REPOSITORY)
    private readonly withdrawalRepository: IWithdrawalRepository,
    @Inject(QUEUE_PORT)
    private readonly queuePort: IQueuePort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: RequestWithdrawalDto, userId: string) {
    // 1. Find account
    const account = await this.prisma.account.findUnique({
      where: { accountNumber: dto.accountNumber },
    });

    if (!account) {
      throw new NotFoundException(`Account ${dto.accountNumber} not found`);
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