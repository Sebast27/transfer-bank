import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Transaction } from '../../domain/entities/transaction.entity';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/ports/transaction-repository.port';
import { Money } from '../../domain/value-objects/money.vo';
import { TransferDto } from '../dto/transfer.dto';
import { IProcessTransferUseCase } from '../ports/process-transfer.port';
import { IQueuePort, QUEUE_PORT } from '../ports/queue.port';

@Injectable()
export class ProcessTransferUseCase implements IProcessTransferUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(QUEUE_PORT)
    private readonly queuePort: IQueuePort,
  ) { }

  async execute(dto: TransferDto): Promise<{ transactionId: string; status: string }> {
    // 1. validate the transfer data
    this.validateTransfer(dto);

    // 2. Create a new Transaction entity
    const amount = new Money(dto.amount);
    const transaction = new Transaction({
      fromAccount: dto.fromAccount,
      toAccount: dto.toAccount,
      amount,
      reference: dto.reference,
    });

    // 3. Save the transaction in the repository(status will be PENDING)
    const saved = await this.transactionRepository.save(transaction);

    // 4. Enqueue the transfer for processing
    try {
      await this.queuePort.add('process-transfer', {
        transactionId: saved.id,
        fromAccountNumber: dto.fromAccount,
        toAccountNumber: dto.toAccount,
        amount: saved.amount.getValue(),
      });
    } catch (error) {
      // If enqueuing fails, mark the transaction as FAILED and throw an exception
      await this.transactionRepository.updateStatus(saved.id, 'FAILED');
      throw new BadRequestException('No se pudo encolar la transferencia');
    }

    return {
      transactionId: saved.id,
      status: saved.status,
    };
  }

  // Validates the transfer data according to business rules
  private validateTransfer(dto: TransferDto): void {
    // 1. validate that the amount is greater than 0
    if (dto.amount <= 0) {
      throw new BadRequestException('The amount must be greater than 0');
    }

    // 2. validate that the source and destination accounts are not the same
    if (dto.fromAccount === dto.toAccount) {
      throw new BadRequestException('You cannot transfer to yourself');
    }

    // 3. validate that the accounts are not empty
    if (!dto.fromAccount || dto.fromAccount.trim() === '') {
      throw new BadRequestException('The source account is required');
    }

    if (!dto.toAccount || dto.toAccount.trim() === '') {
      throw new BadRequestException('The destination account is required');
    }

    // 4. validate maximum transfer amount (example: $10,000)
    const MAX_TRANSFER_AMOUNT = 10000;
    if (dto.amount > MAX_TRANSFER_AMOUNT) {
      throw new BadRequestException(
        `The maximum amount per transfer is $${MAX_TRANSFER_AMOUNT}`
      );
    }

    // 5. validate that the reference is not too long (100 characters)
    if (dto.reference && dto.reference.length > 100) {
      throw new BadRequestException('The reference cannot have more than 100 characters');
    }
  }
}