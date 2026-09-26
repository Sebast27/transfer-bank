import { TransferDto } from '../dto/transfer.dto';

export const PROCESS_TRANSFER_USE_CASE = 'PROCESS_TRANSFER_USE_CASE';

export interface IProcessTransferUseCase {
    execute(dto: TransferDto): Promise<{ transactionId: string; status: string }>;
}