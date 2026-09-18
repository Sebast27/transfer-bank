export const APPROVE_DEPOSIT_USE_CASE = 'APPROVE_DEPOSIT_USE_CASE';

export interface IApproveDepositUseCase {
  execute(depositId: string, adminId: string): Promise<{
    depositId: string;
    status: string;
  }>;
}