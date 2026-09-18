import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRequestDepositUseCase } from '../ports/request-deposit.port';
import { IDepositRepository, DEPOSIT_REPOSITORY } from '../../domain/ports/deposit-repository.port';
import { PrismaService } from '../../../../infrastructure/adapters/prisma/prisma.service';
import { RequestDepositDto } from '../dto/request-deposit.dto';

@Injectable()
export class RequestDepositUseCase implements IRequestDepositUseCase {
  constructor(
    @Inject(DEPOSIT_REPOSITORY)
    private readonly depositRepository: IDepositRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: RequestDepositDto, userId: string) {
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