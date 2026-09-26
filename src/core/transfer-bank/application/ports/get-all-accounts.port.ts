export const GET_ALL_ACCOUNTS_USE_CASE = 'GET_ALL_ACCOUNTS_USE_CASE';

export interface IGetAllAccountsUseCase {
    execute(): Promise<Array<{
        accountNumber: string;
        balance: number;
        owner: {
            email: string;
            name: string;
        };
        updatedAt: Date;
    }>>;
}