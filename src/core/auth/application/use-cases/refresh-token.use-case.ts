import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthRepository, AUTH_REPOSITORY } from '../ports/auth-repository.port';
import { IRefreshUseCase } from '../ports/refresh.port';

@Injectable()
export class RefreshTokenUseCase implements IRefreshUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // 1. Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      });

      // 2. Verify that the user exists
      const user = await this.authRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // 3. Generate new access token
      const accessToken = this.jwtService.sign(
        { sub: user.getId(), email: user.getEmail(), role: user.getRole() },
        { secret: process.env.JWT_SECRET || 'secret', expiresIn: '1h' },
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }
}