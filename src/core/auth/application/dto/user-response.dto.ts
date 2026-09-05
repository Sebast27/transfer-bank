import { UserRole } from '../../domain/entities/user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  initials: string;
  isCorporate: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    initials: string;
    isCorporate: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.role = data.role;
    this.initials = data.initials;
    this.isCorporate = data.isCorporate;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}