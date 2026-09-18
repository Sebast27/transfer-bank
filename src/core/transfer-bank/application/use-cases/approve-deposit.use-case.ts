import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IApproveDepositUseCase } from '../ports/approve-deposit.port';
import { IDepositRepository, DEPOSIT_REPOSITORY } from '../../domain/ports/deposit-repository.port';
import { IQueuePort, QUEUE_PORT } from '../ports/queue.port';

@Injectable()
export class ApproveDepositUseCase implements IApproveDepositUseCase {
  constructor(
    @Inject(DEPOSIT_REPOSITORY)
    private readonly depositRepository: IDepositRepository,
    @Inject(QUEUE_PORT)
    private readonly queuePort: IQueuePort,
  ) {}

  async execute(depositId: string, adminId: string) {
    // 1. Find deposit
    const deposit = await this.depositRepository.findById(depositId);
    if (!deposit) {
      throw new NotFoundException(`Deposit ${depositId} not found`);
    }

    // 2. Verify deposit is PENDING
    if (deposit.status !== 'PENDING') {
      throw new BadRequestException(`Deposit is not pending. Current status: ${deposit.status}`);
    }

    // 3. Update status to APPROVED
    await this.depositRepository.updateStatus(depositId, 'APPROVED', adminId);

    // 4. Enqueue for processing
    await this.queuePort.add('deposit-queue', {
      depositId,
      accountId: deposit.accountId,
      amount: deposit.amount,
    });

    return {
      depositId,
      status: 'APPROVED',
    };
  }
}