import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_REPOSITORY, IAuthRepository } from '../../domain/ports/auth-repository.port';
import { AUTH_TOKEN_PORT, IAuthTokenPort } from '../ports/auth-token.port';
import { IRefreshUseCase } from '../ports/refresh.port';

@Injectable()
export class RefreshTokenUseCase implements IRefreshUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(AUTH_TOKEN_PORT)
    private readonly authTokenPort: IAuthTokenPort,
  ) { }

  async execute(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // 1. Verify the refresh token
      const payload = await this.authTokenPort.verifyRefreshToken(refreshToken);

      if (!payload) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // 2. Verify that the user exists
      const user = await this.authRepository.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // 3. Generate new access token
      const accessToken = await this.authTokenPort.generateTokens(
        user.getId(),
        user.getEmail(),
        user.getRole()
      );

      return { accessToken: accessToken.accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}