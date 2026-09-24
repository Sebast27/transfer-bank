import { UserEntity } from '../../domain/entities/user.entity';
import { RegisterDto } from '../dto/register.dto';

export const REGISTER_USE_CASE = 'REGISTER_USE_CASE';

export interface IRegisterUseCase {
  execute(dto: RegisterDto): Promise<{ user: UserEntity; accessToken: string; refreshToken: string }>;
}