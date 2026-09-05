import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UserResponseDto } from '../dto/user-response.dto';

export const AUTH_SERVICE = 'AUTH_SERVICE';

export interface IAuthService {
  register(dto: RegisterDto): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  }>;

  login(dto: LoginDto): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  }>;
}