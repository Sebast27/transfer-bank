import { Controller, Post, Body, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { RegisterUseCase } from '../../core/auth/application/use-cases/register.use-case';
import { LoginUseCase } from '../../core/auth/application/use-cases/login.use-case';
import { RegisterDto } from '../../core/auth/application/dto/register.dto';
import { LoginDto } from '../../core/auth/application/dto/login.dto';
import { AUTH_SERVICE, IAuthService } from '../../core/auth/application/ports/auth-service.port';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
  ) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}