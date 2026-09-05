import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { IAuthRepository, AUTH_REPOSITORY } from '../ports/auth-repository.port';
import { IAuthTokenPort, AUTH_TOKEN_PORT } from '../ports/auth-token.port';
import { IAuthHashPort, AUTH_HASH_PORT } from '../ports/auth-hash.port';
import { LoginDto } from '../dto/login.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(AUTH_TOKEN_PORT)
    private readonly authTokenPort: IAuthTokenPort,
    @Inject(AUTH_HASH_PORT)
    private readonly authHashPort: IAuthHashPort,
  ) {}

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