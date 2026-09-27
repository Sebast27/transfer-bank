import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as bcrypt from 'bcrypt';
import { BcryptHashAdapter } from '../../../../../src/infrastructure/adapters/auth/bcrypt-hash.adapter';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('BcryptHashAdapter', () => {
  let adapter: BcryptHashAdapter;
  let module: TestingModule;
  const mockHash = jest.mocked(bcrypt.hash);
  const mockCompare = jest.mocked(bcrypt.compare);

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [BcryptHashAdapter],
    }).compile();

    adapter = module.get(BcryptHashAdapter);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should hash a password with the configured work factor', async () => {
    // Arrange
    const plainPassword = 'unit-test-password';
    const hashedPassword = 'mocked-password-hash';
    mockHash.mockResolvedValue(hashedPassword);

    // Act
    const result = await adapter.hash(plainPassword);

    // Assert
    expect(mockHash).toHaveBeenCalledWith(plainPassword, 10);
    expect(result).toBe(hashedPassword);
  });

  it('should compare a password and return true when it matches', async () => {
    // Arrange
    const plainPassword = 'unit-test-password';
    const hashedPassword = 'mocked-password-hash';
    mockCompare.mockResolvedValue(true);

    // Act
    const result = await adapter.compare(plainPassword, hashedPassword);

    // Assert
    expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    expect(result).toBe(true);
  });

  it('should return false when a password does not match', async () => {
    // Arrange
    const plainPassword = 'unit-test-password';
    const hashedPassword = 'mocked-password-hash';
    mockCompare.mockResolvedValue(false);

    // Act
    const result = await adapter.compare(plainPassword, hashedPassword);

    // Assert
    expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword);
    expect(result).toBe(false);
  });
});
