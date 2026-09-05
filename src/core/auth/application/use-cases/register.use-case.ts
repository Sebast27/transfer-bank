import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { AUTH_REPOSITORY, IAuthRepository } from '../ports/auth-repository.port';
import { AUTH_TOKEN_PORT, IAuthTokenPort } from '../ports/auth-token.port';
import { RegisterDto } from '../dto/register.dto';
import { UserEntity } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { AUTH_HASH_PORT, IAuthHashPort } from '../ports/auth-hash.port';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepository: IAuthRepository,
    @Inject(AUTH_TOKEN_PORT)
    private readonly authTokenPort: IAuthTokenPort,
    @Inject(AUTH_HASH_PORT)
    private readonly authHashPort: IAuthHashPort
  ) {}

  async execute(registerDto: RegisterDto) {
    // 1. Check if user already exists
    const existingUser = await this.authRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 2. Create value objects (validates email and password)
    const email = new Email(registerDto.email);
    const password = new Password(registerDto.password);

    // 3. Hash the password using the port (infrastructure)
    const hashedPassword = await this.authHashPort.hash(password.getValue());

    // 4. Create hashed password value object
    const hashedPasswordVO = new Password(hashedPassword, true);

    // 5. Create user entity
    const user = new UserEntity(
      email,
      hashedPasswordVO,
      registerDto.name,
      registerDto.role,
    );

    // 6. Persist user
    const savedUser = await this.authRepository.create(user);

    // 7. Generate tokens
    const tokens = await this.authTokenPort.generateTokens(
      savedUser.getId(),
      savedUser.getEmail(),
      savedUser.getRole(),
    );

    // 8. Return user (without password) and tokens
    return {
      user: savedUser,
      ...tokens,
    };
  }
}