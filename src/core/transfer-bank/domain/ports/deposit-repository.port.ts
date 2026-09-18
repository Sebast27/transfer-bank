export const DEPOSIT_REPOSITORY = 'DEPOSIT_REPOSITORY';

export interface IDepositRepository {
  create(data: {
    accountId: string;
    amount: number;
    requestedBy: string;
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
    requestedBy: string;
    approvedBy: string | null;
    reference: string | null;
    createdAt: Date;
    approvedAt: Date | null;
    completedAt: Date | null;
  } | null>;

  updateStatus(id: string, status: string, approvedBy?: string): Promise<void>;

  findPending(): Promise<any[]>;
}