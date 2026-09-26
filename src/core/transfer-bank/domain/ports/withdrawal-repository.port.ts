export const WITHDRAWAL_REPOSITORY = 'WITHDRAWAL_REPOSITORY';

export interface IWithdrawalRepository {
  create(data: {
    accountId: string;
    amount: number;
    reference?: string;
  }): Promise<{
    id: string;
    status: string;
    amount: number;
  }>;

  findById(id: string): Promise<{
    id: string;
    accountId: string;
    amount: number;
    status: string;
    reference: string | null;
    createdAt: Date;
    completedAt: Date | null;
  } | null>;

  // Datos de cuenta y usuario (para el Worker)
  findByIdWithAccount(id: string): Promise<{
    id: string;
    accountId: string;
    amount: number;
    status: string;
    reference: string | null;
    createdAt: Date;
    completedAt: Date | null;
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
    };
  } | null>;

  updateStatus(id: string, status: string): Promise<void>;

  // Completar retiro (atómica)
  completeWithdrawal(withdrawalId: string, accountId: string, amount: number): Promise<void>;

  // Marcar como fallido
  markAsFailed(withdrawalId: string): Promise<void>;
}