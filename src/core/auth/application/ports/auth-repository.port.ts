import { UserEntity } from '../../domain/entities/user.entity';

export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';

export interface IAuthRepository {

  create(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
}