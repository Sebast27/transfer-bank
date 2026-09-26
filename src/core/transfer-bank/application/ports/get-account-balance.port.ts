export const GET_ACCOUNT_BALANCE_USE_CASE = 'GET_ACCOUNT_BALANCE_USE_CASE';

export interface IGetAccountBalanceUseCase {
    execute(accountNumber: string, userId: string, userRole: string): Promise<{
        accountNumber: string;
        balance: number;
        updatedAt: Date;
    }>;
}