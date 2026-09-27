import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { WithdrawalController } from '../../../../src/presentation/controllers/withdrawal.controller';
import { GET_WITHDRAWAL_STATUS_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/get-withdrawal-status.port';
import { REQUEST_WITHDRAWAL_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/request-withdrawal.port';
import { AuthenticatedUser, UserRole } from '../../../../src/presentation/types/authenticated-user.type';

type UseCaseMock = {
  execute: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
};

describe('WithdrawalController', () => {
  let controller: WithdrawalController;
  let module: TestingModule;
  let requestWithdrawal: UseCaseMock;
  let getWithdrawalStatus: UseCaseMock;

  beforeEach(async () => {
    requestWithdrawal = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    getWithdrawalStatus = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    module = await Test.createTestingModule({
      controllers: [WithdrawalController],
      providers: [
        { provide: REQUEST_WITHDRAWAL_USE_CASE, useValue: requestWithdrawal },
        { provide: GET_WITHDRAWAL_STATUS_USE_CASE, useValue: getWithdrawalStatus },
      ],
    }).compile();
    controller = module.get(WithdrawalController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('requestWithdrawal', () => {
    it('should delegate a withdrawal request with the authenticated user id', async () => {
      // Arrange
      const dto = { accountNumber: 'ACC-001', amount: 50, reference: 'cash' };
      const user: AuthenticatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.USER,
        name: 'Test User',
      };
      const requested = { id: 'withdrawal-1', status: 'PENDING' };
      requestWithdrawal.execute.mockResolvedValue(requested);

      // Act
      const result = await controller.requestWithdrawal(dto, user);

      // Assert
      expect(requestWithdrawal.execute).toHaveBeenCalledWith(dto, user.id);
      expect(result).toBe(requested);
    });
  });

  describe('getWithdrawalStatus', () => {
    it('should delegate status lookup with id, user id, and role', async () => {
      // Arrange
      const id = 'withdrawal-1';
      const user: AuthenticatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.USER,
        name: 'Test User',
      };
      const status = { id, status: 'COMPLETED' };
      getWithdrawalStatus.execute.mockResolvedValue(status);

      // Act
      const result = await controller.getWithdrawalStatus(id, user);

      // Assert
      expect(getWithdrawalStatus.execute).toHaveBeenCalledWith(id, user.id, user.role);
      expect(result).toBe(status);
    });
  });
});
