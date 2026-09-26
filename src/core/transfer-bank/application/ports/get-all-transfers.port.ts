export const GET_ALL_TRANSFERS_USE_CASE = 'GET_ALL_TRANSFERS_USE_CASE';

export interface IGetAllTransfersUseCase {
    execute(): Promise<Array<{
        id: string;
        fromAccount: string;
        toAccount: string;
        amount: number;
        status: string;
        reference: string | null;
        createdAt: Date;
        completedAt: Date | null;
    }>>;
}