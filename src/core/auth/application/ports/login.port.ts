import { LoginDto } from '../dto/login.dto';
import { UserEntity } from '../../domain/entities/user.entity';

export const LOGIN_USE_CASE = 'LOGIN_USE_CASE';

export interface ILoginUseCase {
  execute(dto: LoginDto): Promise<{ user: UserEntity; accessToken: string; refreshToken: string }>;
}