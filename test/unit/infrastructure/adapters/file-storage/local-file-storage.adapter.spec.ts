import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as fs from 'fs';
import { Readable } from 'stream';
import { LocalFileStorageAdapter } from '../../../../../src/infrastructure/adapters/file-storage/local-file-storage.adapter';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
}));

describe('LocalFileStorageAdapter', () => {
  let adapter: LocalFileStorageAdapter;
  let module: TestingModule;
  const mockExistsSync = jest.mocked(fs.existsSync);
  const mockCreateReadStream = jest.mocked(fs.createReadStream);

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [LocalFileStorageAdapter],
    }).compile();

    adapter = module.get(LocalFileStorageAdapter);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return true when the requested file exists', async () => {
    // Arrange
    const filePath = 'mock-storage/statement.pdf';
    mockExistsSync.mockReturnValue(true);

    // Act
    const result = await adapter.exists(filePath);

    // Assert
    expect(mockExistsSync).toHaveBeenCalledWith(filePath);
    expect(result).toBe(true);
  });

  it('should return false when the requested file does not exist', async () => {
    // Arrange
    const filePath = 'mock-storage/missing.pdf';
    mockExistsSync.mockReturnValue(false);

    // Act
    const result = await adapter.exists(filePath);

    // Assert
    expect(mockExistsSync).toHaveBeenCalledWith(filePath);
    expect(result).toBe(false);
  });

  it('should return the read stream for the requested path', () => {
    // Arrange
    const filePath = 'mock-storage/statement.pdf';
    const stream = {} as Readable;
    mockCreateReadStream.mockReturnValue(stream as unknown as fs.ReadStream);

    // Act
    const result = adapter.getStream(filePath);

    // Assert
    expect(mockCreateReadStream).toHaveBeenCalledWith(filePath);
    expect(result).toBe(stream);
  });

  it('should propagate file-system errors when checking for a file', async () => {
    // Arrange
    const error = new Error('File-system failure');
    mockExistsSync.mockImplementation(() => {
      throw error;
    });

    // Act & Assert
    await expect(adapter.exists('mock-storage/statement.pdf')).rejects.toBe(error);
  });

  it('should propagate file-system errors when creating a read stream', () => {
    // Arrange
    const error = new Error('File-system failure');
    mockCreateReadStream.mockImplementation(() => {
      throw error;
    });

    // Act & Assert
    expect(() => adapter.getStream('mock-storage/statement.pdf')).toThrow(error);
  });
});
