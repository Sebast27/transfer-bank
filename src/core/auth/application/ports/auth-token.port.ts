
export interface IAuthTokenPort {
  generateTokens(userId: string, email: string, role: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
  verifyToken(token: string): Promise<{ userId: string; email: string; role: string }>;
}