import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { IUpdateUserUseCase } from '../ports/update-user.port';
import { PrismaService } from '../../../../infrastructure/adapters/prisma/prisma.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UpdateUserUseCase implements IUpdateUserUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, dto: UpdateUserDto) {
    // 1. Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // No se puede actualizar un ADMIN
    if (user.role === 'ADMIN') {
      throw new ForbiddenException('Cannot update an ADMIN user');
    }

    // 2. Prepare update data
    const updateData: any = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
    }

    if (dto.password !== undefined) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    // 3. Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

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