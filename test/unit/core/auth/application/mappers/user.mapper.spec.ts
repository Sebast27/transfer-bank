import { describe, expect, it } from '@jest/globals';
import { UserMapper } from '../../../../../../src/core/auth/application/mappers/user.mapper';
import {
  UserEntity,
  UserRole,
} from '../../../../../../src/core/auth/domain/entities/user.entity';
import { Email } from '../../../../../../src/core/auth/domain/value-objects/email.vo';
import { Password } from '../../../../../../src/core/auth/domain/value-objects/password.vo';

describe('UserMapper', () => {
  const createUser = (overrides: Partial<{
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = {}): UserEntity => {
    const data = {
      id: 'user-1',
      email: 'user@example.com',
      password: 'stored-hash',
      name: 'Ana Example',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
      updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      ...overrides,
    };

    return UserEntity.hydrate(data);
  };

  describe('toResponseDto', () => {
    it('should map all response fields from a UserEntity', () => {
      // Arrange
      const createdAt = new Date('2025-03-01T10:00:00.000Z');
      const updatedAt = new Date('2025-03-02T10:00:00.000Z');
      const user = createUser({
        id: 'user-42',
        email: 'admin@banco.com',
        password: 'sensitive-hash',
        name: 'Ana María Example',
        role: UserRole.ADMIN,
        isActive: false,
        createdAt,
        updatedAt,
      });

      // Act
      const result = UserMapper.toResponseDto(user);

      // Assert
      expect(result).toEqual({
        id: 'user-42',
        email: 'admin@banco.com',
        name: 'Ana María Example',
        role: UserRole.ADMIN,
        initials: 'AE',
        isCorporate: true,
        createdAt,
        updatedAt,
      });
      expect(user.email).toBeInstanceOf(Email);
      expect(user.password).toBeInstanceOf(Password);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('isActive');
      expect(result.email).not.toBe(user.getPassword());
    });

    it('should set isCorporate to false for a non-corporate email', () => {
      // Arrange
      const user = createUser({ email: 'user@example.com' });

      // Act
      const result = UserMapper.toResponseDto(user);

      // Assert
      expect(result.isCorporate).toBe(false);
    });

    it('should calculate one initial for a single-word name', () => {
      // Arrange
      const user = createUser({ name: 'ana' });

      // Act
      const result = UserMapper.toResponseDto(user);

      // Assert
      expect(result.initials).toBe('A');
    });

    it('should calculate two initials for a multi-word name', () => {
      // Arrange
      const user = createUser({ name: 'ana maría example' });

      // Act
      const result = UserMapper.toResponseDto(user);

      // Assert
      expect(result.initials).toBe('AE');
    });
  });

  describe('toResponseDtoList', () => {
    it('should map a list of users to response DTOs', () => {
      // Arrange
      const users = [
        createUser({ id: 'user-1', email: 'first@example.com' }),
        createUser({
          id: 'user-2',
          email: 'second@banco.com',
          name: 'Second User',
          role: UserRole.ADMIN,
        }),
      ];

      // Act
      const result = UserMapper.toResponseDtoList(users);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'user-1',
        email: 'first@example.com',
        name: 'Ana Example',
        role: UserRole.USER,
        initials: 'AE',
        isCorporate: false,
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });
      expect(result[1]).toEqual({
        id: 'user-2',
        email: 'second@banco.com',
        name: 'Second User',
        role: UserRole.ADMIN,
        initials: 'SU',
        isCorporate: true,
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });
    });

    it('should return an empty array for an empty user list', () => {
      // Arrange
      const users: UserEntity[] = [];

      // Act
      const result = UserMapper.toResponseDtoList(users);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
