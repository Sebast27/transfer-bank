import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IWithdrawalRepository, WITHDRAWAL_REPOSITORY } from '../../domain/ports/withdrawal-repository.port';
import { IGetWithdrawalStatusUseCase } from '../ports/get-withdrawal-status.port';

@Injectable()
export class GetWithdrawalStatusUseCase implements IGetWithdrawalStatusUseCase {
    constructor(
        @Inject(WITHDRAWAL_REPOSITORY)
        private readonly withdrawalRepository: IWithdrawalRepository,
    ) { }

    async execute(withdrawalId: string, userId: string, userRole: string) {
        const withdrawal = await this.withdrawalRepository.findById(withdrawalId);

        if (!withdrawal) {
            throw new NotFoundException(`Withdrawal ${withdrawalId} not found`);
        }

        if (withdrawal.accountUserId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException('You do not have access to this withdrawal');
        }

        return {
            id: withdrawal.id,
            accountId: withdrawal.accountId,
            amount: withdrawal.amount,
            status: withdrawal.status,
            reference: withdrawal.reference,
            createdAt: withdrawal.createdAt,
            completedAt: withdrawal.completedAt,
        };
    }
}