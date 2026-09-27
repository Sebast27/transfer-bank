import { ExecutionContext } from '@nestjs/common';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { JwtAuthGuard } from '../../../../src/presentation/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('canActivate', () => {
    it('should delegate activation to the Passport guard', () => {
      // Arrange
      const guard = new JwtAuthGuard();
      const context = {} as ExecutionContext;
      const parentPrototype = Object.getPrototypeOf(JwtAuthGuard.prototype);
      const parentCanActivate = jest
        .spyOn(parentPrototype, 'canActivate')
        .mockReturnValue(true);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(parentCanActivate).toHaveBeenCalledWith(context);
      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return the authenticated user', () => {
      // Arrange
      const guard = new JwtAuthGuard();
      const user = { id: 'user-1', role: 'USER' };

      // Act
      const result = guard.handleRequest(null, user, null);

      // Assert
      expect(result).toBe(user);
    });

    it('should reject when authentication returns an error', () => {
      // Arrange
      const guard = new JwtAuthGuard();
      const error = new Error('Invalid token');

      // Act
      const handleRequest = () => guard.handleRequest(error, null, null);

      // Assert
      expect(handleRequest).toThrow('Token inválido o expirado');
    });

    it('should reject when authentication does not return a user', () => {
      // Arrange
      const guard = new JwtAuthGuard();

      // Act
      const handleRequest = () => guard.handleRequest(null, null, null);

      // Assert
      expect(handleRequest).toThrow('Token inválido o expirado');
    });
  });
});
