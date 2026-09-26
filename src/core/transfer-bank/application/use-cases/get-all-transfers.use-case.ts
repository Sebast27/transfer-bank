import { Inject, Injectable } from '@nestjs/common';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/ports/transaction-repository.port';
import { IGetAllTransfersUseCase } from '../ports/get-all-transfers.port';

@Injectable()
export class GetAllTransfersUseCase implements IGetAllTransfersUseCase {
    constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly transactionRepository: ITransactionRepository,
    ) { }

    async execute() {
        return this.transactionRepository.findAll();
    }
}