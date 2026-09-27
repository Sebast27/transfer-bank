import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AdminController } from '../../../../src/presentation/controllers/admin.controller';
import { GET_USERS_USE_CASE } from '../../../../src/core/auth/application/ports/get-users.port';
import { UPDATE_USER_USE_CASE } from '../../../../src/core/auth/application/ports/update-user.port';
import { CREATE_ACCOUNT_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/create-account.port';
import { GET_ALL_ACCOUNTS_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/get-all-accounts.port';
import { GET_ALL_TRANSFERS_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/get-all-transfers.port';
import { UPDATE_ACCOUNT_STATUS_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/update-account-status.port';
import { AccountStatus } from '../../../../src/core/transfer-bank/application/dto/update-account-status.dto';
import { UserRole } from '../../../../src/core/auth/application/dto/update-user.dto';

type UseCaseMock = {
  execute: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
};

describe('AdminController', () => {
  let controller: AdminController;
  let module: TestingModule;
  let getAllTransfers: UseCaseMock;
  let getAllAccounts: UseCaseMock;
  let createAccount: UseCaseMock;
  let getUsers: UseCaseMock;
  let updateUser: UseCaseMock;
  let updateAccountStatus: UseCaseMock;

  beforeEach(async () => {
    getAllTransfers = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    getAllAccounts = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    createAccount = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    getUsers = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    updateUser = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    updateAccountStatus = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };

    module = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: GET_ALL_TRANSFERS_USE_CASE, useValue: getAllTransfers },
        { provide: GET_ALL_ACCOUNTS_USE_CASE, useValue: getAllAccounts },
        { provide: CREATE_ACCOUNT_USE_CASE, useValue: createAccount },
        { provide: GET_USERS_USE_CASE, useValue: getUsers },
        { provide: UPDATE_USER_USE_CASE, useValue: updateUser },
        { provide: UPDATE_ACCOUNT_STATUS_USE_CASE, useValue: updateAccountStatus },
      ],
    }).compile();
    controller = module.get(AdminController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('admin endpoints', () => {
    it('should delegate listing transfers and accounts', async () => {
      // Arrange
      const transfers = [{ id: 'transfer-1' }];
      const accounts = [{ accountNumber: 'ACC-001' }];
      getAllTransfers.execute.mockResolvedValue(transfers);
      getAllAccounts.execute.mockResolvedValue(accounts);

      // Act
      const transferResult = await controller.getAllTransfers();
      const accountResult = await controller.getAllAccounts();

      // Assert
      expect(getAllTransfers.execute).toHaveBeenCalledTimes(1);
      expect(getAllAccounts.execute).toHaveBeenCalledTimes(1);
      expect(transferResult).toBe(transfers);
      expect(accountResult).toBe(accounts);
    });

    it('should delegate account creation and status updates', async () => {
      // Arrange
      const accountDto = {
        userEmail: 'user@example.com',
        accountNumber: 'ACC-001',
        initialBalance: 0,
      };
      const statusDto = { status: AccountStatus.FROZEN };
      const created = { ...accountDto, status: 'ACTIVE' };
      const updated = { accountNumber: accountDto.accountNumber, status: statusDto.status };
      createAccount.execute.mockResolvedValue(created);
      updateAccountStatus.execute.mockResolvedValue(updated);

      // Act
      const createResult = await controller.createAccount(accountDto);
      const statusResult = await controller.updateAccountStatus(
        accountDto.accountNumber,
        statusDto,
      );

      // Assert
      expect(createAccount.execute).toHaveBeenCalledWith(accountDto);
      expect(updateAccountStatus.execute).toHaveBeenCalledWith(
        accountDto.accountNumber,
        statusDto,
      );
      expect(createResult).toBe(created);
      expect(statusResult).toBe(updated);
    });

    it('should delegate listing and updating users', async () => {
      // Arrange
      const users = [{ id: 'user-1' }];
      const userId = 'user-1';
      const userDto = { name: 'Updated Name', role: UserRole.USER };
      const updated = { id: userId, name: userDto.name };
      getUsers.execute.mockResolvedValue(users);
      updateUser.execute.mockResolvedValue(updated);

      // Act
      const listResult = await controller.getAllUsers();
      const updateResult = await controller.updateUser(userId, userDto);

      // Assert
      expect(getUsers.execute).toHaveBeenCalledTimes(1);
      expect(updateUser.execute).toHaveBeenCalledWith(userId, userDto);
      expect(listResult).toBe(users);
      expect(updateResult).toBe(updated);
    });
  });
});
