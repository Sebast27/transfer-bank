import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { AUTH_REPOSITORY, IAuthRepository } from '../../domain/ports/auth-repository.port';
import { LoginDto } from '../dto/login.dto';
import { AUTH_HASH_PORT, IAuthHashPort } from '../ports/auth-hash.port';
import { AUTH_TOKEN_PORT, IAuthTokenPort } from '../ports/auth-token.port';
import { ILoginUseCase } from '../ports/login.port';

@Injectable()
export class LoginUseCase implements ILoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(AUTH_TOKEN_PORT)
    private readonly authTokenPort: IAuthTokenPort,
    @Inject(AUTH_HASH_PORT)
    private readonly authHashPort: IAuthHashPort,
  ) { }

  async execute(loginDto: LoginDto) {
    // 1. Find user by email
    const user = await this.authRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify password using the hash port
    const isPasswordValid = await this.authHashPort.compare(
      loginDto.password,
      user.getPassword(),
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.getIsActive()) {
      throw new UnauthorizedException('User account is disabled');
    }

    // 3. Generate tokens
    const tokens = await this.authTokenPort.generateTokens(
      user.getId(),
      user.getEmail(),
      user.getRole(),
    );

    // 4. Return user (without password) and tokens
    return {
      user: user,
      ...tokens,
    };
  }
}