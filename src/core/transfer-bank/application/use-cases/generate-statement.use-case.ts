import { Inject, Injectable } from '@nestjs/common';
import { IStatementRepository, STATEMENT_REPOSITORY } from '../../domain/ports/statement-repository.port';
import { RequestStatementDto } from '../dto/request-statement.dto';
import { IGenerateStatementUseCase } from '../ports/generate-statement.port';
import { IQueuePort, QUEUE_PORT } from '../ports/queue.port';

@Injectable()
export class GenerateStatementUseCase implements IGenerateStatementUseCase {
  constructor(
    @Inject(STATEMENT_REPOSITORY)
    private readonly statementRepository: IStatementRepository,
    @Inject(QUEUE_PORT)
    private readonly queuePort: IQueuePort,
  ) { }

  async execute(dto: RequestStatementDto) {
    // 1. Create statement record (PENDING)
    const statement = await this.statementRepository.create({
      accountId: dto.accountNumber,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
    });

    // 2. Enqueue for PDF generation
    await this.queuePort.add('statement-queue', {
      statementId: statement.id,
    });

    return {
      statementId: statement.id,
      status: statement.status,
      accountNumber: dto.accountNumber,
    };
  }
}