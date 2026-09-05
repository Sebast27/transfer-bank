import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IAuthTokenPort } from '../../../core/auth/application/ports/auth-token.port';

@Injectable()
export class JwtTokenAdapter implements IAuthTokenPort {
  constructor(private readonly jwtService: JwtService) {}

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '1h' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d', secret: process.env.JWT_REFRESH_SECRET }),
    ]);

    return { accessToken, refreshToken };
  }

  async verifyToken(token: string) {
    const payload = this.jwtService.verify(token);
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}