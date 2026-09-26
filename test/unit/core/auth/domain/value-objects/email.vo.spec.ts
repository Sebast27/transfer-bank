import { describe, expect, it } from '@jest/globals';
import { Email } from '../../../../../../src/core/auth/domain/value-objects/email.vo';

describe('Email', () => {
  describe('constructor', () => {
    it('should create an email with a valid address', () => {
      // Arrange
      const value = 'user@example.com';

      // Act
      const email = new Email(value);

      // Assert
      expect(email.getValue()).toBe(value);
    });

    it('should accept each supported domain extension', () => {
      // Arrange
      const extensions = [
        '.com',
        '.es',
        '.org',
        '.net',
        '.io',
        '.dev',
        '.app',
        '.edu',
        '.gov',
      ];

      // Act
      const emails = extensions.map(
        (extension) => new Email(`user@example${extension}`),
      );

      // Assert
      expect(emails).toHaveLength(extensions.length);
    });

    it('should reject an address without an at sign', () => {
      // Arrange
      const value = 'userexample.com';

      // Act
      const createEmail = () => new Email(value);

      // Assert
      expect(createEmail).toThrow('Email must contain @');
    });

    it('should reject an address with multiple at signs', () => {
      // Arrange
      const value = 'user@@example.com';

      // Act
      const createEmail = () => new Email(value);

      // Assert
      expect(createEmail).toThrow('Email must be in format: user@domain');
    });

    it('should reject an address without a local part', () => {
      // Arrange
      const value = '@example.com';

      // Act
      const createEmail = () => new Email(value);

      // Assert
      expect(createEmail).toThrow(
        'Email must have a local part before @',
      );
    });

    it('should reject a domain without a dot', () => {
      // Arrange
      const value = 'user@example';

      // Act
      const createEmail = () => new Email(value);

      // Assert
      expect(createEmail).toThrow(
        'Domain must have a valid extension (e.g., .com, .es)',
      );
    });

    it('should reject a domain with an unsupported extension', () => {
      // Arrange
      const value = 'user@example.xyz';

      // Act
      const createEmail = () => new Email(value);

      // Assert
      expect(createEmail).toThrow(
        'Domain must have a valid extension: .com, .es, .org, .net, .io, .dev, .app, .edu, .gov',
      );
    });

    it('should reject a domain with fewer than two characters before its extension', () => {
      // Arrange
      const value = 'user@a.com';

      // Act
      const createEmail = () => new Email(value);

      // Assert
      expect(createEmail).toThrow(
        'Domain must have at least 2 characters before the extension',
      );
    });
  });

  describe('getDomain', () => {
    it('should return the domain part', () => {
      // Arrange
      const email = new Email('user@example.com');

      // Act
      const result = email.getDomain();

      // Assert
      expect(result).toBe('example.com');
    });
  });

  describe('getLocalPart', () => {
    it('should return the local part', () => {
      // Arrange
      const email = new Email('user.name@example.com');

      // Act
      const result = email.getLocalPart();

      // Assert
      expect(result).toBe('user.name');
    });
  });

  describe('isCorporate', () => {
    it.each(['banco.com', 'finanzas.com', 'corp.com'])(
      'should return true for the corporate domain %s',
      (domain) => {
        // Arrange
        const email = new Email(`user@${domain}`);

        // Act
        const result = email.isCorporate();

        // Assert
        expect(result).toBe(true);
      },
    );

    it('should return false for a non-corporate domain', () => {
      // Arrange
      const email = new Email('user@example.com');

      // Act
      const result = email.isCorporate();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getValue', () => {
    it('should return the full email address', () => {
      // Arrange
      const value = 'user@example.com';
      const email = new Email(value);

      // Act
      const result = email.getValue();

      // Assert
      expect(result).toBe(value);
    });
  });

  describe('equals', () => {
    it('should return true for the same email address', () => {
      // Arrange
      const email = new Email('user@example.com');
      const other = new Email('user@example.com');

      // Act
      const result = email.equals(other);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for different email addresses', () => {
      // Arrange
      const email = new Email('user@example.com');
      const other = new Email('other@example.com');

      // Act
      const result = email.equals(other);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the full email address', () => {
      // Arrange
      const value = 'user@example.com';
      const email = new Email(value);

      // Act
      const result = email.toString();

      // Assert
      expect(result).toBe(value);
    });
  });
});
