import { UpdateUserDto } from '../dto/update-user.dto';

export const UPDATE_USER_USE_CASE = 'UPDATE_USER_USE_CASE';

export interface IUpdateUserUseCase {
  execute(userId: string, dto: UpdateUserDto): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    updatedAt: Date;
  }>;
}