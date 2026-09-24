import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan Pérez', description: 'User full name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'newpassword123!', description: 'New password' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'User role' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: true, description: 'User is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}