import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Transaction } from '../../domain/entities/transaction.entity';
import { Money } from '../../domain/value-objects/money.vo';
import { ITransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/ports/transaction-repository.port';
import { IQueuePort, QUEUE_PORT } from '../ports/queue.port';
import { TransferDto } from '../dto/transfer.dto';
import { ITransactionService, TRANSACTION_SERVICE } from '../ports/transaction-service.port';

@Injectable()
export class ProcessTransferUseCase implements ITransactionService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(QUEUE_PORT)
    private readonly queuePort: IQueuePort,
  ) {}

  async transfer(dto: TransferDto): Promise<{ transactionId: string; status: string }> {
    // 1. VALIDACIONES DE NEGOCIO (antes de guardar)
    this.validateTransfer(dto);

    // 2. Crear la entidad de dominio
    const amount = new Money(dto.amount);
    const transaction = new Transaction({
      fromAccount: dto.fromAccount,
      toAccount: dto.toAccount,
      amount,
      reference: dto.reference,
    });

    // 3. Guardar en el repositorio (estado PENDING)
    const saved = await this.transactionRepository.save(transaction);

    // 4. Encolar para procesamiento asíncrono
    try {
      await this.queuePort.add('process-transfer', {
        transactionId: saved.id,
        fromAccountNumber: dto.fromAccount,
        toAccountNumber: dto.toAccount, 
        amount: saved.amount.getValue(),
      });
    } catch (error) {
      // Si falla el encolado, marcar como FAILED
      await this.transactionRepository.updateStatus(saved.id, 'FAILED');
      throw new BadRequestException('No se pudo encolar la transferencia');
    }

    return {
      transactionId: saved.id,
      status: saved.status,
    };
  }

  async getStatus(id: string): Promise<any> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      return { message: 'Transacción no encontrada', statusCode: 404 };
    }
    return transaction.toJSON();
  }

  // ✅ MÉTODO DE VALIDACIÓN (antes de guardar)
  private validateTransfer(dto: TransferDto): void {
    // 1. Validar que el monto sea mayor a 0
    if (dto.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a 0');
    }

    // 2. Validar que la cuenta origen y destino no sean iguales
    if (dto.fromAccount === dto.toAccount) {
      throw new BadRequestException('No puedes transferirte a ti mismo');
    }

    // 3. Validar que las cuentas no estén vacías
    if (!dto.fromAccount || dto.fromAccount.trim() === '') {
      throw new BadRequestException('La cuenta origen es requerida');
    }

    if (!dto.toAccount || dto.toAccount.trim() === '') {
      throw new BadRequestException('La cuenta destino es requerida');
    }

    // 4. Validar límite máximo por transferencia (ejemplo: $10,000)
    const MAX_TRANSFER_AMOUNT = 10000;
    if (dto.amount > MAX_TRANSFER_AMOUNT) {
      throw new BadRequestException(
        `El monto máximo por transferencia es $${MAX_TRANSFER_AMOUNT}`
      );
    }

    // 5. Validar que la referencia no sea demasiado larga (100 caracteres)
    if (dto.reference && dto.reference.length > 100) {
      throw new BadRequestException('La referencia no puede tener más de 100 caracteres');
    }
  }
}