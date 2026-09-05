import { Email } from "../value-objects/email.vo";
import { Password } from "../value-objects/password.vo";

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export class UserEntity {
  id: string;
  email: Email;
  password: Password;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    email: Email,
    password: Password,
    name: string,
    role: UserRole = UserRole.USER
  ) {
    this.validateName(name);

    this.id = crypto.randomUUID();
    this.email = email;
    this.password = password;
    this.name = name.trim().replace(/\s+/g, ' ');
    this.role = role;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Getters
  getId(): string { return this.id; }
  getEmail(): string { return this.email.getValue(); }
  getPassword(): string { return this.password.getValue(); }
  getName(): string { return this.name; }
  getRole(): UserRole { return this.role; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }

  // Validation for name
  private validateName(name: string): void {
    const minLength = 2;
    const maxLength = 50;
    const hasValidChars = /^[a-zA-Z\sáéíóúñÑ]+$/.test(name);

    if (name.length < minLength) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (name.length > maxLength) {
      throw new Error('Name must be less than 50 characters');
    }

    if (!hasValidChars) {
      throw new Error('Name can only contain letters and spaces');
    }
  }

  // Hydrate method to create a UserEntity from raw data
  static hydrate(data: {
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
  }): UserEntity {
    const user = new UserEntity(
      new Email(data.email),
      new Password(data.password, true),
      data.name,
      data.role,
    );
    user.id = data.id;
    user.createdAt = data.createdAt;
    user.updatedAt = data.updatedAt;
    return user;
  }

  // Business logic methods
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  getInitials(): string {
    const words = this.name.split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  }

  isCorporateEmail(): boolean {
    return this.email.isCorporate();
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}