import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class RegisterDto {
  @ApiProperty({ example: 'user@test.com', description: 'Users email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Users password' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'John Doe', description: 'Users full name' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'USER', description: 'Users role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}