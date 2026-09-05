export const AUTH_TOKEN_PORT = 'AUTH_TOKEN_PORT';

export interface IAuthTokenPort {
  generateTokens(userId: string, email: string, role: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
  verifyToken(token: string): Promise<{ userId: string; email: string; role: string }>;
}