import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DepositController } from '../../../../src/presentation/controllers/deposit.controller';
import { APPROVE_DEPOSIT_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/approve-deposit.port';
import { GET_DEPOSIT_STATUS_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/get-deposit-status.port';
import { GET_PENDING_DEPOSITS_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/get-pending-deposits.port';
import { REQUEST_DEPOSIT_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/request-deposit.port';
import { AuthenticatedUser, UserRole } from '../../../../src/presentation/types/authenticated-user.type';

type UseCaseMock = {
  execute: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
};

describe('DepositController', () => {
  let controller: DepositController;
  let module: TestingModule;
  let requestDeposit: UseCaseMock;
  let approveDeposit: UseCaseMock;
  let getDepositStatus: UseCaseMock;
  let getPendingDeposits: UseCaseMock;

  beforeEach(async () => {
    requestDeposit = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    approveDeposit = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    getDepositStatus = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    getPendingDeposits = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    module = await Test.createTestingModule({
      controllers: [DepositController],
      providers: [
        { provide: REQUEST_DEPOSIT_USE_CASE, useValue: requestDeposit },
        { provide: APPROVE_DEPOSIT_USE_CASE, useValue: approveDeposit },
        { provide: GET_DEPOSIT_STATUS_USE_CASE, useValue: getDepositStatus },
        { provide: GET_PENDING_DEPOSITS_USE_CASE, useValue: getPendingDeposits },
      ],
    }).compile();
    controller = module.get(DepositController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('deposit endpoints', () => {
    it('should request a deposit for the authenticated user', async () => {
      // Arrange
      const dto = { accountNumber: 'ACC-001', amount: 100, reference: 'cash' };
      const user: AuthenticatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.USER,
        name: 'Test User',
      };
      const requested = { id: 'deposit-1', status: 'PENDING' };
      requestDeposit.execute.mockResolvedValue(requested);

      // Act
      const result = await controller.requestDeposit(dto, user);

      // Assert
      expect(requestDeposit.execute).toHaveBeenCalledWith(dto, user.id);
      expect(result).toBe(requested);
    });

    it('should request deposit status with user identity and role', async () => {
      // Arrange
      const id = 'deposit-1';
      const user: AuthenticatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.USER,
        name: 'Test User',
      };
      const status = { id, status: 'PENDING' };
      getDepositStatus.execute.mockResolvedValue(status);

      // Act
      const result = await controller.getDepositStatus(id, user);

      // Assert
      expect(getDepositStatus.execute).toHaveBeenCalledWith(id, user.id, user.role);
      expect(result).toBe(status);
    });

    it('should list pending deposits', async () => {
      // Arrange
      const user: AuthenticatedUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };
      const pending = [{ id: 'deposit-1' }];
      getPendingDeposits.execute.mockResolvedValue(pending);

      // Act
      const result = await controller.getPendingDeposits(user);

      // Assert
      expect(getPendingDeposits.execute).toHaveBeenCalledTimes(1);
      expect(result).toBe(pending);
    });

    it('should approve a deposit using the authenticated admin id', async () => {
      // Arrange
      const id = 'deposit-1';
      const user: AuthenticatedUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };
      const approved = { id, status: 'APPROVED' };
      approveDeposit.execute.mockResolvedValue(approved);

      // Act
      const result = await controller.approveDeposit(id, user);

      // Assert
      expect(approveDeposit.execute).toHaveBeenCalledWith(id, user.id);
      expect(result).toBe(approved);
    });
  });
});
