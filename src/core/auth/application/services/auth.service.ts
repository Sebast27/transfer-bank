import { Injectable } from '@nestjs/common';
import { IAuthService } from '../ports/auth-service.port';
import { RegisterUseCase } from '../use-cases/register.use-case';
import { LoginUseCase } from '../use-cases/login.use-case';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async register(dto: RegisterDto) {
    const result = await this.registerUseCase.execute(dto);
    return {
      user: UserMapper.toResponseDto(result.user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  async login(dto: LoginDto) {
    const result = await this.loginUseCase.execute(dto);
    return {
      user: UserMapper.toResponseDto(result.user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}