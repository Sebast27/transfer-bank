import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IUserRepository, USER_REPOSITORY } from '../../domain/ports/user-repository.port';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AUTH_HASH_PORT, IAuthHashPort } from '../ports/auth-hash.port';
import { IUpdateUserUseCase } from '../ports/update-user.port';

@Injectable()
export class UpdateUserUseCase implements IUpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(AUTH_HASH_PORT)
    private readonly authHashPort: IAuthHashPort,
  ) { }

  async execute(userId: string, dto: UpdateUserDto) {
    // 1. Check if user exists
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // 2. Check if user is ADMIN
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot update an ADMIN user');
    }

    // 3. Prepare update data
    const updateData: any = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.password !== undefined) {
      updateData.password = await this.authHashPort.hash(dto.password);
    }

    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    // 4. Update user
    const updatedUser = await this.userRepository.update(userId, updateData);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      updatedAt: updatedUser.updatedAt,
    };
  }
}