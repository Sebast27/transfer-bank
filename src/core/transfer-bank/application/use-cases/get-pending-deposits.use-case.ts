import { Inject, Injectable } from '@nestjs/common';
import { DEPOSIT_REPOSITORY, IDepositRepository } from '../../domain/ports/deposit-repository.port';
import { IGetPendingDepositsUseCase } from '../ports/get-pending-deposits.port';

@Injectable()
export class GetPendingDepositsUseCase implements IGetPendingDepositsUseCase {
    constructor(
        @Inject(DEPOSIT_REPOSITORY)
        private readonly depositRepository: IDepositRepository,
    ) { }

    async execute() {
        return this.depositRepository.findPending();
    }
}