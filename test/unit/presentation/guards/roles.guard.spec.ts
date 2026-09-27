import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { RolesGuard } from '../../../../src/presentation/guards/roles.guard';
import { ROLES_KEY } from '../../../../src/presentation/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let getAllAndOverride: jest.SpiedFunction<Reflector['getAllAndOverride']>;
  let context: ExecutionContext;
  let user: { role?: string } | undefined;

  beforeEach(() => {
    reflector = new Reflector();
    getAllAndOverride = jest.spyOn(reflector, 'getAllAndOverride');
    guard = new RolesGuard(reflector);
    user = undefined;
    context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      // Arrange
      getAllAndOverride.mockReturnValue(undefined);

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
      expect(getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should allow access when the user has a required role', () => {
      // Arrange
      getAllAndOverride.mockReturnValue(['ADMIN']);
      user = { role: 'ADMIN' };

      // Act
      const result = guard.canActivate(context);

      // Assert
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when the request has no user role', () => {
      // Arrange
      getAllAndOverride.mockReturnValue(['ADMIN']);

      // Act
      const canActivate = () => guard.canActivate(context);

      // Assert
      expect(canActivate).toThrow(
        new ForbiddenException('User has no role'),
      );
    });

    it('should throw ForbiddenException when the user role is not allowed', () => {
      // Arrange
      getAllAndOverride.mockReturnValue(['ADMIN', 'SUPERVISOR']);
      user = { role: 'USER' };

      // Act
      const canActivate = () => guard.canActivate(context);

      // Assert
      expect(canActivate).toThrow(
        new ForbiddenException('Access denied. Required roles: ADMIN, SUPERVISOR'),
      );
    });
  });
});
