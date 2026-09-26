import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IStatementRepository, STATEMENT_REPOSITORY } from '../../domain/ports/statement-repository.port';
import { IGetStatementStatusUseCase } from '../ports/get-statement-status.port';

@Injectable()
export class GetStatementStatusUseCase implements IGetStatementStatusUseCase {
    constructor(
        @Inject(STATEMENT_REPOSITORY)
        private readonly statementRepository: IStatementRepository,
    ) { }

    async execute(statementId: string, userId: string, userRole: string) {
        const statement = await this.statementRepository.findById(statementId);

        if (!statement) {
            throw new NotFoundException(`Statement ${statementId} not found`);
        }

        if (statement.accountUserId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException('You do not have access to this statement');
        }

        return {
            id: statement.id,
            accountNumber: statement.accountNumber,
            periodStart: statement.periodStart,
            periodEnd: statement.periodEnd,
            status: statement.status,
            filePath: statement.filePath,
            error: statement.error,
            createdAt: statement.createdAt,
            completedAt: statement.completedAt,
        };
    }
}