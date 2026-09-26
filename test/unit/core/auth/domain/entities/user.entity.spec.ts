import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  UserEntity,
  UserRole,
} from '../../../../../../src/core/auth/domain/entities/user.entity';
import { Email } from '../../../../../../src/core/auth/domain/value-objects/email.vo';
import { Password } from '../../../../../../src/core/auth/domain/value-objects/password.vo';

describe('UserEntity', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a user with the provided valid properties', () => {
      // Arrange
      const email = new Email('user@example.com');
      const password = new Password('SecurePass1!');
      const name = 'Ana Example';
      const role = UserRole.ADMIN;
      const isActive = false;

      // Act
      const user = new UserEntity(email, password, name, role, isActive);

      // Assert
      expect(user.email).toBe(email);
      expect(user.password).toBe(password);
      expect(user.getName()).toBe(name);
      expect(user.getRole()).toBe(role);
      expect(user.getIsActive()).toBe(isActive);
    });

    it('should generate a UUID for the user id', () => {
      // Arrange
      const email = new Email('user@example.com');
      const password = new Password('SecurePass1!');

      // Act
      const user = new UserEntity(email, password, 'Ana Example');

      // Assert
      expect(user.getId()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should default the role to USER and isActive to true', () => {
      // Arrange
      const email = new Email('user@example.com');
      const password = new Password('SecurePass1!');

      // Act
      const user = new UserEntity(email, password, 'Ana Example');

      // Assert
      expect(user.getRole()).toBe(UserRole.USER);
      expect(user.getIsActive()).toBe(true);
    });

    it('should trim the name and replace multiple spaces with a single space', () => {
      // Arrange
      const email = new Email('user@example.com');
      const password = new Password('SecurePass1!');
      const name = '  Ana    María   Example  ';

      // Act
      const user = new UserEntity(email, password, name);

      // Assert
      expect(user.getName()).toBe('Ana María Example');
    });

    it('should reject a name shorter than two characters', () => {
      // Arrange
      const email = new Email('user@example.com');
      const password = new Password('SecurePass1!');

      // Act
      const createUser = () => new UserEntity(email, password, 'A');

      // Assert
      expect(createUser).toThrow('Name must be at least 2 characters long');
    });

    it('should reject a name longer than fifty characters', () => {
      // Arrange
      const email = new Email('user@example.com');
      const password = new Password('SecurePass1!');
      const name = 'A'.repeat(51);

      // Act
      const createUser = () => new UserEntity(email, password, name);

      // Assert
      expect(createUser).toThrow('Name must be less than 50 characters');
    });

    it('should reject a name containing numbers', () => {
      // Arrange
      const email = new Email('user@example.com');
      const password = new Password('SecurePass1!');

      // Act
      const createUser = () => new UserEntity(email, password, 'Ana2 Example');

      // Assert
      expect(createUser).toThrow('Name can only contain letters and spaces');
    });

    it('should allow accented letters and ñ in the name', () => {
      // Arrange
      const email = new Email('user@example.com');
      const password = new Password('SecurePass1!');
      const name = 'José Muñoz';

      // Act
      const user = new UserEntity(email, password, name);

      // Assert
      expect(user.getName()).toBe(name);
    });
  });

  describe('hydrate', () => {
    it('should reconstruct a user from persisted data', () => {
      // Arrange
      const data = {
        id: 'user-123',
        email: 'admin@banco.com',
        password: 'persisted-hash',
        name: 'Ana Example',
        role: UserRole.ADMIN,
        isActive: false,
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-02-01T10:00:00.000Z'),
      };

      // Act
      const user = UserEntity.hydrate(data);

      // Assert
      expect(user.getId()).toBe(data.id);
      expect(user.getEmail()).toBe(data.email);
      expect(user.getPassword()).toBe(data.password);
      expect(user.password.isHashedValue()).toBe(true);
      expect(user.getName()).toBe(data.name);
      expect(user.getRole()).toBe(data.role);
      expect(user.getIsActive()).toBe(data.isActive);
      expect(user.getCreatedAt()).toBe(data.createdAt);
      expect(user.getUpdatedAt()).toBe(data.updatedAt);
    });
  });

  describe('isAdmin', () => {
    it('should return true for an admin user', () => {
      // Arrange
      const user = new UserEntity(
        new Email('admin@example.com'),
        new Password('SecurePass1!'),
        'Admin User',
        UserRole.ADMIN,
      );

      // Act
      const result = user.isAdmin();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for a regular user', () => {
      // Arrange
      const user = new UserEntity(
        new Email('user@example.com'),
        new Password('SecurePass1!'),
        'Regular User',
      );

      // Act
      const result = user.isAdmin();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isCorporateEmail', () => {
    it('should return true for a corporate email address', () => {
      // Arrange
      const user = new UserEntity(
        new Email('user@banco.com'),
        new Password('SecurePass1!'),
        'Regular User',
      );

      // Act
      const result = user.isCorporateEmail();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for a non-corporate email address', () => {
      // Arrange
      const user = new UserEntity(
        new Email('user@example.com'),
        new Password('SecurePass1!'),
        'Regular User',
      );

      // Act
      const result = user.isCorporateEmail();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getInitials', () => {
    it('should return one uppercase initial for a single-word name', () => {
      // Arrange
      const user = new UserEntity(
        new Email('user@example.com'),
        new Password('SecurePass1!'),
        'ana',
      );

      // Act
      const result = user.getInitials();

      // Assert
      expect(result).toBe('A');
    });

    it('should return initials from the first and last words in a multi-word name', () => {
      // Arrange
      const user = new UserEntity(
        new Email('user@example.com'),
        new Password('SecurePass1!'),
        'Ana María Example',
      );

      // Act
      const result = user.getInitials();

      // Assert
      expect(result).toBe('AE');
    });
  });

  describe('getId', () => {
    it('should return the user id', () => {
      // Arrange
      const user = UserEntity.hydrate({
        id: 'user-123',
        email: 'user@example.com',
        password: 'persisted-hash',
        name: 'Ana Example',
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      // Act
      const result = user.getId();

      // Assert
      expect(result).toBe('user-123');
    });
  });

  describe('getEmail', () => {
    it('should return the email address', () => {
      // Arrange
      const user = new UserEntity(
        new Email('user@example.com'),
        new Password('SecurePass1!'),
        'Ana Example',
      );

      // Act
      const result = user.getEmail();

      // Assert
      expect(result).toBe('user@example.com');
    });
  });

  describe('getPassword', () => {
    it('should return the password value', () => {
      // Arrange
      const user = new UserEntity(
        new Email('user@example.com'),
        new Password('SecurePass1!'),
        'Ana Example',
      );

      // Act
      const result = user.getPassword();

      // Assert
      expect(result).toBe('SecurePass1!');
    });
  });

  describe('getName', () => {
    it('should return the normalized name', () => {
      // Arrange
      const user = new UserEntity(
        new Email('user@example.com'),
        new Password('SecurePass1!'),
        '  Ana   Example  ',
      );

      // Act
      const result = user.getName();

      // Assert
      expect(result).toBe('Ana Example');
    });
  });

  describe('getRole', () => {
    it('should return the user role', () => {
      // Arrange
      const user = new UserEntity(
        new Email('user@example.com'),
        new Password('SecurePass1!'),
        'Ana Example',
        UserRole.ADMIN,
      );

      // Act
      const result = user.getRole();

      // Assert
      expect(result).toBe(UserRole.ADMIN);
    });
  });

  describe('getIsActive', () => {
    it('should return whether the user is active', () => {
      // Arrange
      const user = new UserEntity(
        new Email('user@example.com'),
        new Password('SecurePass1!'),
        'Ana Example',
        UserRole.USER,
        false,
      );

      // Act
      const result = user.getIsActive();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getCreatedAt', () => {
    it('should return the creation date', () => {
      // Arrange
      const createdAt = new Date('2025-01-01T10:00:00.000Z');
      const user = UserEntity.hydrate({
        id: 'user-123',
        email: 'user@example.com',
        password: 'persisted-hash',
        name: 'Ana Example',
        role: UserRole.USER,
        isActive: true,
        createdAt,
        updatedAt: new Date('2025-01-02T10:00:00.000Z'),
      });

      // Act
      const result = user.getCreatedAt();

      // Assert
      expect(result).toBe(createdAt);
    });
  });

  describe('getUpdatedAt', () => {
    it('should return the last update date', () => {
      // Arrange
      const updatedAt = new Date('2025-01-02T10:00:00.000Z');
      const user = UserEntity.hydrate({
        id: 'user-123',
        email: 'user@example.com',
        password: 'persisted-hash',
        name: 'Ana Example',
        role: UserRole.USER,
        isActive: true,
        createdAt: new Date('2025-01-01T10:00:00.000Z'),
        updatedAt,
      });

      // Act
      const result = user.getUpdatedAt();

      // Assert
      expect(result).toBe(updatedAt);
    });
  });

  describe('toJSON', () => {
    it('should serialize the user properties without exposing the password', () => {
      // Arrange
      const createdAt = new Date('2025-01-01T10:00:00.000Z');
      const updatedAt = new Date('2025-01-02T10:00:00.000Z');
      const user = UserEntity.hydrate({
        id: 'user-123',
        email: 'user@example.com',
        password: 'persisted-hash',
        name: 'Ana Example',
        role: UserRole.ADMIN,
        isActive: false,
        createdAt,
        updatedAt,
      });

      // Act
      const result = user.toJSON();

      // Assert
      expect(result).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Ana Example',
        role: UserRole.ADMIN,
        isActive: false,
        createdAt,
        updatedAt,
      });
      expect(result).not.toHaveProperty('password');
    });
  });
});
