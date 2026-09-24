import { Inject, Injectable } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { UserMapper } from '../mappers/user.mapper';
import { IAuthService } from '../ports/auth-service.port';
import { ILoginUseCase, LOGIN_USE_CASE } from '../ports/login.port';
import { IRefreshUseCase, REFRESH_USE_CASE } from '../ports/refresh.port';
import { IRegisterUseCase, REGISTER_USE_CASE } from '../ports/register.port';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(REGISTER_USE_CASE)
    private readonly registerUseCase: IRegisterUseCase,
    @Inject(LOGIN_USE_CASE)
    private readonly loginUseCase: ILoginUseCase,
    @Inject(REFRESH_USE_CASE)
    private readonly refreshTokenUseCase: IRefreshUseCase,
  ) { }

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

  async refresh(dto: RefreshTokenDto) {
    const result = await this.refreshTokenUseCase.execute(dto.refreshToken);
    return {
      accessToken: result.accessToken,
    };
  }
}