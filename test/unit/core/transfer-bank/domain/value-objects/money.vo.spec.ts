import { describe, expect, it } from '@jest/globals';
import { Money } from '../../../../../../src/core/transfer-bank/domain/value-objects/money.vo';

describe('Money', () => {
  describe('constructor', () => {
    it('should create a money value for a non-negative amount', () => {
      // Arrange
      const value = 12.5;

      // Act
      const money = new Money(value);

      // Assert
      expect(money.getValue()).toBe(value);
    });

    it('should allow zero', () => {
      // Arrange
      const value = 0;

      // Act
      const money = new Money(value);

      // Assert
      expect(money.getValue()).toBe(value);
    });

    it('should throw when the amount is negative', () => {
      // Arrange
      const value = -0.01;

      // Act
      const createMoney = () => new Money(value);

      // Assert
      expect(createMoney).toThrow('The amount cannot be negative.');
    });
  });

  describe('getValue', () => {
    it('should return the amount', () => {
      // Arrange
      const money = new Money(42.75);

      // Act
      const result = money.getValue();

      // Assert
      expect(result).toBe(42.75);
    });
  });

  describe('equals', () => {
    it('should return true for equal amounts', () => {
      // Arrange
      const money = new Money(10);
      const other = new Money(10);

      // Act
      const result = money.equals(other);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for different amounts', () => {
      // Arrange
      const money = new Money(10);
      const other = new Money(0);

      // Act
      const result = money.equals(other);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isGreaterThan', () => {
    it('should return true when the amount is greater', () => {
      // Arrange
      const money = new Money(10);
      const other = new Money(0);

      // Act
      const result = money.isGreaterThan(other);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when the amounts are equal', () => {
      // Arrange
      const money = new Money(10);
      const other = new Money(10);

      // Act
      const result = money.isGreaterThan(other);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isLessThan', () => {
    it('should return true when the amount is less', () => {
      // Arrange
      const money = new Money(0);
      const other = new Money(10);

      // Act
      const result = money.isLessThan(other);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when the amounts are equal', () => {
      // Arrange
      const money = new Money(10);
      const other = new Money(10);

      // Act
      const result = money.isLessThan(other);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('add', () => {
    it('should return a new money value with the sum', () => {
      // Arrange
      const money = new Money(10);
      const other = new Money(0);

      // Act
      const result = money.add(other);

      // Assert
      expect(result.getValue()).toBe(10);
      expect(result).not.toBe(money);
      expect(money.getValue()).toBe(10);
    });
  });

  describe('subtract', () => {
    it('should return a new money value with the difference', () => {
      // Arrange
      const money = new Money(10);
      const other = new Money(4);

      // Act
      const result = money.subtract(other);

      // Assert
      expect(result.getValue()).toBe(6);
      expect(result).not.toBe(money);
      expect(money.getValue()).toBe(10);
    });

    it('should allow a zero result', () => {
      // Arrange
      const money = new Money(10);
      const other = new Money(10);

      // Act
      const result = money.subtract(other);

      // Assert
      expect(result.getValue()).toBe(0);
    });

    it('should throw when the result would be negative', () => {
      // Arrange
      const money = new Money(0);
      const other = new Money(0.01);

      // Act
      const subtract = () => money.subtract(other);

      // Assert
      expect(subtract).toThrow('The amount cannot be negative.');
    });
  });

  describe('toString', () => {
    it('should format the amount to two decimal places', () => {
      // Arrange
      const money = new Money(12.5);

      // Act
      const result = money.toString();

      // Assert
      expect(result).toBe('12.50');
    });

    it('should format zero to two decimal places', () => {
      // Arrange
      const money = new Money(0);

      // Act
      const result = money.toString();

      // Assert
      expect(result).toBe('0.00');
    });
  });
});
