import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as fs from 'fs';
import PDFDocument = require('pdfkit');
import * as path from 'path';
import { PdfKitAdapter } from '../../../../../src/infrastructure/adapters/pdf/pdfkit.adapter';

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(),
}));

jest.mock('pdfkit', () => jest.fn());

describe('PdfKitAdapter', () => {
  let adapter: PdfKitAdapter;
  let module: TestingModule;
  let document: {
    pipe: jest.Mock;
    fontSize: jest.Mock;
    text: jest.Mock;
    moveDown: jest.Mock;
    end: jest.Mock;
  };
  let outputStream: {
    on: jest.Mock;
  };
  let streamHandlers: Record<string, (error?: Error) => void>;
  const mockExistsSync = jest.mocked(fs.existsSync);
  const mockMkdirSync = jest.mocked(fs.mkdirSync);
  const mockCreateWriteStream = jest.mocked(fs.createWriteStream);
  const MockPDFDocument = jest.mocked(PDFDocument);

  beforeEach(async () => {
    streamHandlers = {};
    document = {
      pipe: jest.fn(),
      fontSize: jest.fn(),
      text: jest.fn(),
      moveDown: jest.fn(),
      end: jest.fn(),
    };
    document.pipe.mockReturnValue(document);
    document.fontSize.mockReturnValue(document);
    document.text.mockReturnValue(document);
    document.moveDown.mockReturnValue(document);

    outputStream = {
      on: jest.fn((event: string, handler: (error?: Error) => void) => {
        streamHandlers[event] = handler;
        return outputStream;
      }),
    };

    MockPDFDocument.mockImplementation((() => document) as never);
    mockExistsSync.mockReturnValue(true);
    mockCreateWriteStream.mockReturnValue(outputStream as unknown as fs.WriteStream);

    module = await Test.createTestingModule({
      providers: [PdfKitAdapter],
    }).compile();

    adapter = module.get(PdfKitAdapter);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  const statementData = (transactions: Array<{
    date: Date;
    type: string;
    amount: number;
    balance: number;
    description: string;
  }> = []) => ({
    accountNumber: '1234567890',
    ownerName: 'Test Customer',
    balance: 1250.5,
    periodStart: new Date('2026-01-01T00:00:00.000Z'),
    periodEnd: new Date('2026-01-31T00:00:00.000Z'),
    transactions,
  });

  const finishDocument = async (
    promise: Promise<string>,
  ): Promise<string> => {
    await Promise.resolve();
    streamHandlers.finish();
    return promise;
  };

  it('should create the output directory when it does not exist', async () => {
    // Arrange
    mockExistsSync.mockReturnValue(false);
    const expectedDirectory = path.join(process.cwd(), 'storage', 'statements');

    // Act
    const resultPromise = adapter.generateStatement(statementData());
    const result = await finishDocument(resultPromise);

    // Assert
    expect(mockExistsSync).toHaveBeenCalledWith(expectedDirectory);
    expect(mockMkdirSync).toHaveBeenCalledWith(expectedDirectory, { recursive: true });
    expect(result).toContain(path.join('storage', 'statements', 'statement-1234567890-'));
    expect(result).toMatch(/\.pdf$/);
  });

  it('should skip creating the output directory when it already exists', async () => {
    // Arrange
    mockExistsSync.mockReturnValue(true);

    // Act
    const resultPromise = adapter.generateStatement(statementData());
    const result = await finishDocument(resultPromise);

    // Assert
    expect(mockMkdirSync).not.toHaveBeenCalled();
    expect(mockCreateWriteStream).toHaveBeenCalledWith(result);
    expect(result).toContain(path.join('storage', 'statements'));
  });

  it('should generate a statement containing account details and the empty-period message', async () => {
    // Arrange
    const data = statementData();

    // Act
    const resultPromise = adapter.generateStatement(data);
    await finishDocument(resultPromise);

    // Assert
    expect(MockPDFDocument).toHaveBeenCalledWith({ margin: 50 });
    expect(document.pipe).toHaveBeenCalledWith(outputStream);
    expect(document.text).toHaveBeenCalledWith('BANCO DIGITAL', { align: 'center' });
    expect(document.text).toHaveBeenCalledWith('ESTADO DE CUENTA', { align: 'center' });
    expect(document.text).toHaveBeenCalledWith(`Cuenta: ${data.accountNumber}`);
    expect(document.text).toHaveBeenCalledWith(`Titular: ${data.ownerName}`);
    expect(document.text).toHaveBeenCalledWith(`Saldo actual: $${data.balance.toFixed(2)}`);
    expect(document.text).toHaveBeenCalledWith('No hay movimientos en este período');
    expect(document.end).toHaveBeenCalled();
    expect(outputStream.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(outputStream.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('should include transaction details when the statement has transactions', async () => {
    // Arrange
    const transaction = {
      date: new Date('2026-01-15T00:00:00.000Z'),
      type: 'DEPOSIT',
      amount: 50.25,
      balance: 1250.5,
      description: 'Payroll',
    };
    const data = statementData([transaction]);

    // Act
    const resultPromise = adapter.generateStatement(data);
    await finishDocument(resultPromise);

    // Assert
    expect(document.text).toHaveBeenCalledWith(
      `${transaction.date.toLocaleDateString()} | DEPOSIT | $50.25 | Payroll`,
    );
    expect(document.text).not.toHaveBeenCalledWith('No hay movimientos en este período');
  });

  it('should reject when the output stream emits an error', async () => {
    // Arrange
    const error = new Error('Disk write failed');
    const resultPromise = adapter.generateStatement(statementData());
    await Promise.resolve();

    // Act
    streamHandlers.error(error);

    // Assert
    await expect(resultPromise).rejects.toBe(error);
  });

  it('should reject when PDF document construction fails', async () => {
    // Arrange
    const error = new Error('PDF initialization failed');
    MockPDFDocument.mockImplementation(() => {
      throw error;
    });

    // Act & Assert
    await expect(adapter.generateStatement(statementData())).rejects.toBe(error);
  });
});
