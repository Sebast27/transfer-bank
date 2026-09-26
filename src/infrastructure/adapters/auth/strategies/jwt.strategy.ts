import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AUTH_REPOSITORY, IAuthRepository } from '../../../../core/auth/domain/ports/auth-repository.port';
import { AuthenticatedUser, UserRole } from '../../../../presentation/types/authenticated-user.type';

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

  async validate(payload: { sub: string; email: string; role: string }): Promise<AuthenticatedUser | null> {
    const user = await this.authRepository.findById(payload.sub);
    if (!user) {
      return null;
    }
    return {
      id: user.getId(),
      email: user.getEmail(),
      role: user.getRole() as UserRole,
      name: user.getName(),
    };
  }
}