import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { Password } from '../../../../../../src/core/auth/domain/value-objects/password.vo';

describe('Password', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create a password when the value meets all requirements', () => {
      // Arrange
      const value = 'SecurePass1!';

      // Act
      const password = new Password(value);

      // Assert
      expect(password.getValue()).toBe(value);
      expect(password.isHashedValue()).toBe(false);
    });

    it('should create a password without validation when the value is hashed', () => {
      // Arrange
      const value = 'short-hash';

      // Act
      const password = new Password(value, true);

      // Assert
      expect(password.getValue()).toBe(value);
      expect(password.isHashedValue()).toBe(true);
    });

    it('should reject a password shorter than eight characters', () => {
      // Arrange
      const value = 'Ab1!';

      // Act
      const createPassword = () => new Password(value);

      // Assert
      expect(createPassword).toThrow(
        'Password must be at least 8 characters long',
      );
    });

    it('should reject a password without an uppercase letter', () => {
      // Arrange
      const value = 'abcdefgh1!';

      // Act
      const createPassword = () => new Password(value);

      // Assert
      expect(createPassword).toThrow(
        'Password must contain at least one uppercase letter',
      );
    });

    it('should reject a password without a lowercase letter', () => {
      // Arrange
      const value = 'ABCDEFGH1!';

      // Act
      const createPassword = () => new Password(value);

      // Assert
      expect(createPassword).toThrow(
        'Password must contain at least one lowercase letter',
      );
    });

    it('should reject a password without a number', () => {
      // Arrange
      const value = 'Abcdefgh!';

      // Act
      const createPassword = () => new Password(value);

      // Assert
      expect(createPassword).toThrow(
        'Password must contain at least one number',
      );
    });

    it('should reject a password without a special character', () => {
      // Arrange
      const value = 'Abcdefgh1';

      // Act
      const createPassword = () => new Password(value);

      // Assert
      expect(createPassword).toThrow(
        'Password must contain at least one special character (!@#$%^&*())',
      );
    });
  });

  describe('getValue', () => {
    it('should return the password value', () => {
      // Arrange
      const value = 'SecurePass1!';
      const password = new Password(value);

      // Act
      const result = password.getValue();

      // Assert
      expect(result).toBe(value);
    });
  });

  describe('isHashedValue', () => {
    it('should return false for a plain password', () => {
      // Arrange
      const password = new Password('SecurePass1!');

      // Act
      const result = password.isHashedValue();

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for a hashed password', () => {
      // Arrange
      const password = new Password('stored-hash', true);

      // Act
      const result = password.isHashedValue();

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for passwords with the same value', () => {
      // Arrange
      const password = new Password('SecurePass1!');
      const other = new Password('SecurePass1!');

      // Act
      const result = password.equals(other);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for passwords with different values', () => {
      // Arrange
      const password = new Password('SecurePass1!');
      const other = new Password('DifferentPass2@');

      // Act
      const result = password.equals(other);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the password value', () => {
      // Arrange
      const value = 'SecurePass1!';
      const password = new Password(value);

      // Act
      const result = password.toString();

      // Assert
      expect(result).toBe(value);
    });
  });
});
