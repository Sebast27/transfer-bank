import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ITransactionRepository, TRANSACTION_REPOSITORY } from "../../domain/ports/transaction-repository.port";
import { IGetTransferStatusUseCase } from "../ports/get-transfer-status.port";

@Injectable()
export class GetTransferStatusUseCase implements IGetTransferStatusUseCase {
    constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly transactionRepository: ITransactionRepository,
    ) { }

    async execute(id: string) {
        const transaction = await this.transactionRepository.findById(id);
        if (!transaction) {
            throw new NotFoundException(`Transaction ${id} not found`);
        }
        return transaction.toJSON();
    }
}