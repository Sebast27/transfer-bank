export const GET_PENDING_DEPOSITS_USE_CASE = 'GET_PENDING_DEPOSITS_USE_CASE';

export interface IGetPendingDepositsUseCase {
    execute(): Promise<Array<{
        id: string;
        amount: number;
        accountNumber: string;
        requestedBy: string;
        reference: string | null;
        createdAt: Date;
    }>>;
}