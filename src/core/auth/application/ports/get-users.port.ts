export const GET_USERS_USE_CASE = 'GET_USERS_USE_CASE';

export interface IGetUsersUseCase {
  execute(): Promise<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    accounts: Array<{
      accountNumber: string;
      balance: number;
    }>;
  }>>;
}