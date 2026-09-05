import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../../core/auth/application/services/auth.service';
import { RegisterUseCase } from '../../core/auth/application/use-cases/register.use-case';
import { LoginUseCase } from '../../core/auth/application/use-cases/login.use-case';
import { AuthRepositoryAdapter } from '../../infrastructure/adapters/auth/auth-repository.adapter';
import { JwtTokenAdapter } from '../../infrastructure/adapters/auth/jwt-token.adapter';
import { BcryptHashAdapter } from '../../infrastructure/adapters/auth/bcrypt-hash.adapter';
import { AUTH_REPOSITORY } from '../../core/auth/application/ports/auth-repository.port';
import { AUTH_TOKEN_PORT } from '../../core/auth/application/ports/auth-token.port';
import { AUTH_HASH_PORT } from '../../core/auth/application/ports/auth-hash.port';
import { AUTH_SERVICE } from '../../core/auth/application/ports/auth-service.port';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';  
import { JwtStrategy } from '../../infrastructure/adapters/auth/strategies/jwt.strategy';
import { RefreshTokenUseCase } from '@/core/auth/application/use-cases/refresh-token.use-case';
import { REFRESH_USE_CASE } from '@/core/auth/application/ports/refresh.port';
import { LOGIN_USE_CASE } from '@/core/auth/application/ports/login.port';
import { REGISTER_USE_CASE } from '@/core/auth/application/ports/register.port';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Servicio de aplicación (implementa el puerto primario)
    {
      provide: AUTH_SERVICE,
      useClass: AuthService,
    },
    // Casos de uso con tokens
    {
      provide: REGISTER_USE_CASE,
      useClass: RegisterUseCase,
    },
    {
      provide: LOGIN_USE_CASE,
      useClass: LoginUseCase,
    },
    {
      provide: REFRESH_USE_CASE,
      useClass: RefreshTokenUseCase,
    },

    // Adaptadores de infraestructura (puertos secundarios)
    {
      provide: AUTH_REPOSITORY,
      useClass: AuthRepositoryAdapter,
    },
    {
      provide: AUTH_TOKEN_PORT,
      useClass: JwtTokenAdapter,
    },
    {
      provide: AUTH_HASH_PORT,
      useClass: BcryptHashAdapter,
    },
    JwtStrategy,
  ],
  exports: [AUTH_SERVICE, PassportModule],
})
export class AuthModule {}