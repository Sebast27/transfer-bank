export const GET_DEPOSIT_STATUS_USE_CASE = 'GET_DEPOSIT_STATUS_USE_CASE';

export interface IGetDepositStatusUseCase {
    execute(depositId: string, userId: string, userRole: string): Promise<{
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
    }>;
}