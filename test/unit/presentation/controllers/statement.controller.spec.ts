import { PassThrough } from 'stream';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { StatementController } from '../../../../src/presentation/controllers/statement.controller';
import { DOWNLOAD_STATEMENT_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/download-statement.port';
import { GENERATE_STATEMENT_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/generate-statement.port';
import { GET_STATEMENT_STATUS_USE_CASE } from '../../../../src/core/transfer-bank/application/ports/get-statement-status.port';
import { AuthenticatedUser, UserRole } from '../../../../src/presentation/types/authenticated-user.type';

type UseCaseMock = {
  execute: jest.Mock<(...args: unknown[]) => Promise<unknown>>;
};

describe('StatementController', () => {
  let controller: StatementController;
  let module: TestingModule;
  let generateStatement: UseCaseMock;
  let getStatementStatus: UseCaseMock;
  let downloadStatement: UseCaseMock;

  beforeEach(async () => {
    generateStatement = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    getStatementStatus = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    downloadStatement = { execute: jest.fn<(...args: unknown[]) => Promise<unknown>>() };
    module = await Test.createTestingModule({
      controllers: [StatementController],
      providers: [
        { provide: GENERATE_STATEMENT_USE_CASE, useValue: generateStatement },
        { provide: GET_STATEMENT_STATUS_USE_CASE, useValue: getStatementStatus },
        { provide: DOWNLOAD_STATEMENT_USE_CASE, useValue: downloadStatement },
      ],
    }).compile();
    controller = module.get(StatementController);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  describe('requestStatement', () => {
    it('should delegate statement generation with the request DTO', async () => {
      // Arrange
      const dto = {
        accountNumber: 'ACC-001',
        periodStart: '2025-01-01',
        periodEnd: '2025-01-31',
      };
      const user: AuthenticatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.USER,
        name: 'Test User',
      };
      const queued = { statementId: 'statement-1', status: 'PENDING' };
      generateStatement.execute.mockResolvedValue(queued);

      // Act
      const result = await controller.requestStatement(dto, user);

      // Assert
      expect(generateStatement.execute).toHaveBeenCalledWith(dto);
      expect(result).toBe(queued);
    });
  });

  describe('getStatementStatus', () => {
    it('should delegate status lookup with id, user id, and role', async () => {
      // Arrange
      const id = 'statement-1';
      const user: AuthenticatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.USER,
        name: 'Test User',
      };
      const status = { id, status: 'READY' };
      getStatementStatus.execute.mockResolvedValue(status);

      // Act
      const result = await controller.getStatementStatus(id, user);

      // Assert
      expect(getStatementStatus.execute).toHaveBeenCalledWith(id, user.id, user.role);
      expect(result).toBe(status);
    });
  });

  describe('downloadStatement', () => {
    it('should return a streamable PDF with attachment headers', async () => {
      // Arrange
      const id = 'statement-1';
      const user: AuthenticatedUser = {
        id: 'user-1',
        email: 'user@example.com',
        role: UserRole.USER,
        name: 'Test User',
      };
      const stream = new PassThrough();
      downloadStatement.execute.mockResolvedValue({
        stream,
        fileName: 'statement.pdf',
        contentType: 'application/pdf',
      });

      // Act
      const result = await controller.downloadStatement(id, user);

      // Assert
      expect(downloadStatement.execute).toHaveBeenCalledWith(id, user.id, user.role);
      expect(result.getHeaders()).toEqual({
        type: 'application/pdf',
        disposition: 'attachment; filename="statement.pdf"',
      });
      expect(result.getStream()).toBe(stream);
      stream.destroy();
    });
  });
});
