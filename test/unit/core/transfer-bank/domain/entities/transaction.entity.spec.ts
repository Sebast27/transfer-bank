import { describe, expect, it } from '@jest/globals';
import {
  Transaction,
  TransactionStatus,
} from '../../../../../../src/core/transfer-bank/domain/entities/transaction.entity';
import { Money } from '../../../../../../src/core/transfer-bank/domain/value-objects/money.vo';

describe('Transaction', () => {
  describe('constructor', () => {
    it('should create a transaction with the provided properties', () => {
      // Arrange
      const createdAt = new Date('2025-01-01T00:00:00.000Z');
      const completedAt = new Date('2025-01-02T00:00:00.000Z');
      const props = {
        id: 'transaction-1',
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
        status: TransactionStatus.COMPLETED,
        reference: 'reference-1',
        createdAt,
        completedAt,
      };

      // Act
      const transaction = new Transaction(props);

      // Assert
      expect(transaction.id).toBe(props.id);
      expect(transaction.fromAccount).toBe(props.fromAccount);
      expect(transaction.toAccount).toBe(props.toAccount);
      expect(transaction.amount).toBe(props.amount);
      expect(transaction.status).toBe(props.status);
      expect(transaction.reference).toBe(props.reference);
      expect(transaction.createdAt).toBe(createdAt);
      expect(transaction.completedAt).toBe(completedAt);
    });

    it('should generate an id and default optional properties', () => {
      // Arrange
      const beforeCreation = new Date();

      // Act
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(0),
      });
      const afterCreation = new Date();

      // Assert
      expect(transaction.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(transaction.status).toBe(TransactionStatus.PENDING);
      expect(transaction.reference).toBeUndefined();
      expect(transaction.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreation.getTime(),
      );
      expect(transaction.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreation.getTime(),
      );
      expect(transaction.completedAt).toBeUndefined();
    });
  });

  describe('markAsProcessing', () => {
    it('should transition a pending transaction to processing', () => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
      });

      // Act
      transaction.markAsProcessing();

      // Assert
      expect(transaction.status).toBe(TransactionStatus.PROCESSING);
    });

    it.each([
      TransactionStatus.PROCESSING,
      TransactionStatus.COMPLETED,
      TransactionStatus.FAILED,
    ])('should reject a transaction in %s status', (status) => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
        status,
      });

      // Act
      const markAsProcessing = () => transaction.markAsProcessing();

      // Assert
      expect(markAsProcessing).toThrow(
        'Only one pending transaction can be processed.',
      );
    });
  });

  describe('markAsCompleted', () => {
    it('should complete a processing transaction and set its completion date', () => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
        status: TransactionStatus.PROCESSING,
      });
      const beforeCompletion = new Date();

      // Act
      transaction.markAsCompleted();
      const afterCompletion = new Date();

      // Assert
      expect(transaction.status).toBe(TransactionStatus.COMPLETED);
      expect(transaction.completedAt).toBeInstanceOf(Date);
      expect(transaction.completedAt!.getTime()).toBeGreaterThanOrEqual(
        beforeCompletion.getTime(),
      );
      expect(transaction.completedAt!.getTime()).toBeLessThanOrEqual(
        afterCompletion.getTime(),
      );
    });

    it.each([
      TransactionStatus.PENDING,
      TransactionStatus.COMPLETED,
      TransactionStatus.FAILED,
    ])('should reject a transaction in %s status', (status) => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
        status,
      });

      // Act
      const markAsCompleted = () => transaction.markAsCompleted();

      // Assert
      expect(markAsCompleted).toThrow(
        'Only a processing transaction can be completed.',
      );
    });
  });

  describe('markAsFailed', () => {
    it.each([TransactionStatus.PENDING, TransactionStatus.PROCESSING])(
      'should mark a %s transaction as failed',
      (status) => {
        // Arrange
        const transaction = new Transaction({
          fromAccount: 'account-1',
          toAccount: 'account-2',
          amount: new Money(25),
          status,
        });

        // Act
        transaction.markAsFailed();

        // Assert
        expect(transaction.status).toBe(TransactionStatus.FAILED);
      },
    );

    it.each([TransactionStatus.COMPLETED, TransactionStatus.FAILED])(
      'should reject a %s transaction',
      (status) => {
        // Arrange
        const transaction = new Transaction({
          fromAccount: 'account-1',
          toAccount: 'account-2',
          amount: new Money(25),
          status,
        });

        // Act
        const markAsFailed = () => transaction.markAsFailed();

        // Assert
        expect(markAsFailed).toThrow(
          'Only a pending or processing transaction can be marked as failed.',
        );
      },
    );
  });

  describe('isPending', () => {
    it('should return true for a pending transaction', () => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
      });

      // Act
      const result = transaction.isPending();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for a non-pending transaction', () => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
        status: TransactionStatus.PROCESSING,
      });

      // Act
      const result = transaction.isPending();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true for a completed transaction', () => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
        status: TransactionStatus.COMPLETED,
      });

      // Act
      const result = transaction.isCompleted();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for a non-completed transaction', () => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
      });

      // Act
      const result = transaction.isCompleted();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isFailed', () => {
    it('should return true for a failed transaction', () => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
        status: TransactionStatus.FAILED,
      });

      // Act
      const result = transaction.isFailed();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for a non-failed transaction', () => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25),
      });

      // Act
      const result = transaction.isFailed();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should serialize all transaction properties', () => {
      // Arrange
      const createdAt = new Date('2025-01-01T00:00:00.000Z');
      const completedAt = new Date('2025-01-02T00:00:00.000Z');
      const transaction = new Transaction({
        id: 'transaction-1',
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(25.5),
        status: TransactionStatus.COMPLETED,
        reference: 'reference-1',
        createdAt,
        completedAt,
      });

      // Act
      const result = transaction.toJSON();

      // Assert
      expect(result).toEqual({
        id: 'transaction-1',
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: 25.5,
        status: TransactionStatus.COMPLETED,
        reference: 'reference-1',
        createdAt,
        completedAt,
      });
    });

    it('should serialize omitted optional properties as undefined', () => {
      // Arrange
      const transaction = new Transaction({
        fromAccount: 'account-1',
        toAccount: 'account-2',
        amount: new Money(0),
      });

      // Act
      const result = transaction.toJSON();

      // Assert
      expect(result.reference).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
      expect(result.amount).toBe(0);
    });
  });
});
