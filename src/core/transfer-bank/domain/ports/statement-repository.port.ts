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

  findByIdWithAccount(id: string): Promise<{
    id: string;
    accountId: string;
    periodStart: Date;
    periodEnd: Date;
    status: string;
    filePath: string | null;
    account: {
      id: string;
      accountNumber: string;
      balance: number;
      status: string;
      user: {
        id: string;
        email: string;
        name: string;
      };
      transactions: Array<{
        id: string;
        fromAccountId: string;
        toAccountId: string;
        amount: number;
        status: string;
        reference: string | null;
        createdAt: Date;
      }>;
    };
  } | null>;

  // Actualizar status
  updateStatus(id: string, status: string): Promise<void>;

  // Completar con filePath
  completeStatement(id: string, filePath: string): Promise<void>;

  // Marcar como fallido
  markAsFailed(id: string, error: string): Promise<void>;
}