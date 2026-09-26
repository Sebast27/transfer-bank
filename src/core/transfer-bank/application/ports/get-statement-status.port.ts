export const GET_STATEMENT_STATUS_USE_CASE = 'GET_STATEMENT_STATUS_USE_CASE';

export interface IGetStatementStatusUseCase {
    execute(statementId: string, userId: string, userRole: string): Promise<{
        id: string;
        accountNumber: string;
        periodStart: Date;
        periodEnd: Date;
        status: string;
        filePath: string | null;
        error: string | null;
        createdAt: Date;
        completedAt: Date | null;
    }>;
}