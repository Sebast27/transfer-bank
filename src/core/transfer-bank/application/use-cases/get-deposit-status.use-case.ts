import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DEPOSIT_REPOSITORY, IDepositRepository } from '../../domain/ports/deposit-repository.port';
import { IGetDepositStatusUseCase } from '../ports/get-deposit-status.port';

@Injectable()
export class GetDepositStatusUseCase implements IGetDepositStatusUseCase {
    constructor(
        @Inject(DEPOSIT_REPOSITORY)
        private readonly depositRepository: IDepositRepository,
    ) { }

    async execute(depositId: string, userId: string, userRole: string) {
        // 1. Find deposit
        const deposit = await this.depositRepository.findById(depositId);

        if (!deposit) {
            throw new NotFoundException(`Deposit ${depositId} not found`);
        }

        // 2. Verify ownership (only owner or ADMIN can see it)
        if (deposit.requestedBy !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException('You do not have access to this deposit');
        }

        return {
            id: deposit.id,
            accountId: deposit.accountId,
            amount: deposit.amount,
            status: deposit.status,
            requestedBy: deposit.requestedBy,
            approvedBy: deposit.approvedBy,
            reference: deposit.reference,
            createdAt: deposit.createdAt,
            approvedAt: deposit.approvedAt,
            completedAt: deposit.completedAt,
        };
    }
}