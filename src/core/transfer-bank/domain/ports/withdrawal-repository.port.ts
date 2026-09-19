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

  updateStatus(id: string, status: string): Promise<void>;
}