export const GET_WITHDRAWAL_STATUS_USE_CASE = 'GET_WITHDRAWAL_STATUS_USE_CASE';

export interface IGetWithdrawalStatusUseCase {
    execute(withdrawalId: string, userId: string, userRole: string): Promise<{
        id: string;
        accountId: string;
        amount: number;
        status: string;
        reference: string | null;
        createdAt: Date;
        completedAt: Date | null;
    }>;
}