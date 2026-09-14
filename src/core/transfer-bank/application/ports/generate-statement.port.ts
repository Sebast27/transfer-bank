import { RequestStatementDto } from '../dto/request-statement.dto';

export const GENERATE_STATEMENT_USE_CASE = 'GENERATE_STATEMENT_USE_CASE';

export interface IGenerateStatementUseCase {
  execute(dto: RequestStatementDto): Promise<{
    statementId: string;
    status: string;
    accountNumber: string;
  }>;
}