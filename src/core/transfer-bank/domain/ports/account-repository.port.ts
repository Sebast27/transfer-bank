export const ACCOUNT_REPOSITORY = 'ACCOUNT_REPOSITORY';

export interface IAccountRepository {
  findByNumber(accountNumber: string): Promise<{
    id: string;
    accountNumber: string;
    balance: number;
    status: string;
    userId: string;
    updatedAt: Date;
  } | null>;

  // With user data (for the Worker)
  findByNumberWithUser(accountNumber: string): Promise<{
    id: string;
    accountNumber: string;
    balance: number;
    status: string;
    userId: string;
    user: {
      id: string;
      email: string;
      name: string;
    };
  } | null>;

  findUserByEmail(email: string): Promise<{
    id: string;
    email: string;
    name: string;
  } | null>;

  create(data: {
    accountNumber: string;
    balance: number;
    userId: string;
  }): Promise<{
    id: string;
    accountNumber: string;
    balance: number;
    owner: {
      email: string;
      name: string;
    };
  }>;

  updateStatus(accountNumber: string, status: string): Promise<{
    accountNumber: string;
    status: string;
    updatedAt: Date;
  }>;
}