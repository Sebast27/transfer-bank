import { TransferDto } from '../dto/transfer.dto';

export const TRANSACTION_SERVICE = 'TRANSACTION_SERVICE';

export interface ITransactionService {
  transfer(dto: TransferDto): Promise<{ transactionId: string; status: string }>;
  getStatus(id: string): Promise<any>;
}