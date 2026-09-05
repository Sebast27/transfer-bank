import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAuthRepository, AUTH_REPOSITORY } from '../../../../core/auth/application/ports/auth-repository.port';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.authRepository.findById(payload.sub);
    if (!user) {
      return null;
    }
    return {
      id: user.getId(),
      email: user.getEmail(),
      role: user.getRole(),
      name: user.getName(),
    };
  }
}