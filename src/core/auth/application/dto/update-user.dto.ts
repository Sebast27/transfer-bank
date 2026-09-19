import { IsString, IsOptional, IsBoolean, IsEnum, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan Pérez', description: 'Nombre completo' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'newpassword123!', description: 'Nueva contraseña' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Rol del usuario' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: true, description: 'Usuario activo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}