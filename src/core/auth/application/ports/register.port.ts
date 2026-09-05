import { RegisterDto } from '../dto/register.dto';
import { UserEntity } from '../../domain/entities/user.entity';

export const REGISTER_USE_CASE = 'REGISTER_USE_CASE';

export interface IRegisterUseCase {
  execute(dto: RegisterDto): Promise<{ user: UserEntity; accessToken: string; refreshToken: string }>;
}