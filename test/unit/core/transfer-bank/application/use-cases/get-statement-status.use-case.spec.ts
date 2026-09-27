import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetStatementStatusUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/get-statement-status.use-case';
import { IStatementRepository, STATEMENT_REPOSITORY } from '../../../../../../src/core/transfer-bank/domain/ports/statement-repository.port';

describe('GetStatementStatusUseCase', () => {
  let useCase: GetStatementStatusUseCase;
  let module: TestingModule;
  let statementRepository: jest.Mocked<IStatementRepository>;
  const statement = {
    id: 'statement-1',
    accountId: 'account-1',
    accountNumber: 'ACC-001',
    accountUserId: 'user-1',
    periodStart: new Date('2026-01-01T00:00:00.000Z'),
    periodEnd: new Date('2026-01-31T00:00:00.000Z'),
    status: 'COMPLETED',
    filePath: 'statements/statement-1.pdf',
    error: null,
    createdAt: new Date('2026-02-01T00:00:00.000Z'),
    completedAt: new Date('2026-02-01T00:01:00.000Z'),
  };

  beforeEach(async () => {
    statementRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithAccount: jest.fn(),
      updateStatus: jest.fn(),
      completeStatement: jest.fn(),
      markAsFailed: jest.fn(),
    };
    module = await Test.createTestingModule({
      providers: [GetStatementStatusUseCase, { provide: STATEMENT_REPOSITORY, useValue: statementRepository }],
    }).compile();
    useCase = module.get(GetStatementStatusUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return the statement status to its owner', async () => {
    statementRepository.findById.mockResolvedValue(statement);

    const result = await useCase.execute('statement-1', 'user-1', 'USER');

    expect(result).toEqual({
      id: statement.id,
      accountNumber: statement.accountNumber,
      periodStart: statement.periodStart,
      periodEnd: statement.periodEnd,
      status: statement.status,
      filePath: statement.filePath,
      error: statement.error,
      createdAt: statement.createdAt,
      completedAt: statement.completedAt,
    });
  });

  it('should allow an admin to view another users statement', async () => {
    statementRepository.findById.mockResolvedValue(statement);

    await expect(useCase.execute('statement-1', 'admin-1', 'ADMIN')).resolves.toMatchObject({ id: 'statement-1' });
  });

  it('should throw when the statement does not exist', async () => {
    statementRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'user-1', 'USER')).rejects.toThrow(NotFoundException);
  });

  it('should forbid a user from viewing another users statement', async () => {
    statementRepository.findById.mockResolvedValue(statement);

    await expect(useCase.execute('statement-1', 'user-2', 'USER')).rejects.toThrow(ForbiddenException);
  });
});
