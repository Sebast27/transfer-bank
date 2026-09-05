export const REFRESH_USE_CASE = 'REFRESH_USE_CASE';

export interface IRefreshUseCase {
  execute(refreshToken: string): Promise<{ accessToken: string }>;
}