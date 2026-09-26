export const GET_TRANSFER_STATUS_USE_CASE = 'GET_TRANSFER_STATUS_USE_CASE';

export interface IGetTransferStatusUseCase {
    execute(id: string): Promise<any>;
}