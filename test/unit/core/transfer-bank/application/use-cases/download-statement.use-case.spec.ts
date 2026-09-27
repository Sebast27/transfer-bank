import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Readable } from 'stream';
import { DownloadStatementUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/download-statement.use-case';
import { IStatementRepository, STATEMENT_REPOSITORY } from '../../../../../../src/core/transfer-bank/domain/ports/statement-repository.port';
import { FILE_STORAGE_PORT, IFileStoragePort } from '../../../../../../src/core/transfer-bank/application/ports/file-storage.port';

describe('DownloadStatementUseCase', () => {
  let useCase: DownloadStatementUseCase;
  let module: TestingModule;
  let statementRepository: jest.Mocked<IStatementRepository>;
  let fileStorage: jest.Mocked<IFileStoragePort>;
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
    fileStorage = { exists: jest.fn(), getStream: jest.fn() };
    module = await Test.createTestingModule({
      providers: [
        DownloadStatementUseCase,
        { provide: STATEMENT_REPOSITORY, useValue: statementRepository },
        { provide: FILE_STORAGE_PORT, useValue: fileStorage },
      ],
    }).compile();
    useCase = module.get(DownloadStatementUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return the PDF stream to the statement owner', async () => {
    const stream = Readable.from(['pdf-data']);
    statementRepository.findById.mockResolvedValue(statement);
    fileStorage.exists.mockResolvedValue(true);
    fileStorage.getStream.mockReturnValue(stream);

    const result = await useCase.execute('statement-1', 'user-1', 'USER');

    expect(result).toEqual({
      stream,
      fileName: 'statement-statement-1.pdf',
      contentType: 'application/pdf',
    });
    expect(fileStorage.exists).toHaveBeenCalledWith(statement.filePath);
    expect(fileStorage.getStream).toHaveBeenCalledWith(statement.filePath);
  });

  it('should allow an admin to download another users statement', async () => {
    statementRepository.findById.mockResolvedValue(statement);
    fileStorage.exists.mockResolvedValue(true);
    fileStorage.getStream.mockReturnValue(Readable.from(['pdf-data']));

    await expect(useCase.execute('statement-1', 'admin-1', 'ADMIN'))
      .resolves.toMatchObject({ fileName: 'statement-statement-1.pdf' });
  });

  it('should throw when the statement does not exist', async () => {
    statementRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing', 'user-1', 'USER')).rejects.toThrow(NotFoundException);
    expect(fileStorage.exists).not.toHaveBeenCalled();
  });

  it('should forbid access to another users statement', async () => {
    statementRepository.findById.mockResolvedValue(statement);

    await expect(useCase.execute('statement-1', 'user-2', 'USER')).rejects.toThrow(ForbiddenException);
    expect(fileStorage.exists).not.toHaveBeenCalled();
  });

  it('should reject a statement that is not completed', async () => {
    statementRepository.findById.mockResolvedValue({ ...statement, status: 'PENDING' });

    await expect(useCase.execute('statement-1', 'user-1', 'USER')).rejects.toThrow(BadRequestException);
    expect(fileStorage.exists).not.toHaveBeenCalled();
  });

  it('should throw when the completed statement has no file path', async () => {
    statementRepository.findById.mockResolvedValue({ ...statement, filePath: null });

    await expect(useCase.execute('statement-1', 'user-1', 'USER')).rejects.toThrow(NotFoundException);
    expect(fileStorage.exists).not.toHaveBeenCalled();
  });

  it('should throw when the statement file is missing from storage', async () => {
    statementRepository.findById.mockResolvedValue(statement);
    fileStorage.exists.mockResolvedValue(false);

    await expect(useCase.execute('statement-1', 'user-1', 'USER')).rejects.toThrow(NotFoundException);
    expect(fileStorage.getStream).not.toHaveBeenCalled();
  });
});
