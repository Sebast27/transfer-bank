import { Injectable } from '@nestjs/common';
import { IAuthRepository } from '../../../core/auth/application/ports/auth-repository.port';
import { UserEntity } from '../../../core/auth/domain/entities/user.entity';
import { PrismaService } from '../../adapters/prisma/prisma.service';

@Injectable()
export class AuthRepositoryAdapter implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return null;

    return UserEntity.hydrate({
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role as any,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return UserEntity.hydrate({
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role as any,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }

  async create(user: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const created = await this.prisma.user.create({
      data: {
        email: user.getEmail(),
        password: user.getPassword(),
        name: user.getName(),
        role: user.getRole(),
      },
    });

    return UserEntity.hydrate({
      id: created.id,
      email: created.email,
      password: created.password,
      name: created.name,
      role: created.role as any,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }
}