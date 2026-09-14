export const STATEMENT_REPOSITORY = 'STATEMENT_REPOSITORY';

export interface IStatementRepository {
  create(data: {
    accountId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<{
    id: string;
    status: string;
  }>;

  findById(id: string): Promise<{
    id: string;
    accountId: string;
    periodStart: Date;
    periodEnd: Date;
    status: string;
    filePath: string | null;
    error: string | null;
    createdAt: Date;
    completedAt: Date | null;
  } | null>;
}