import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { GetPendingDepositsUseCase } from '../../../../../../src/core/transfer-bank/application/use-cases/get-pending-deposits.use-case';
import { DEPOSIT_REPOSITORY, IDepositRepository } from '../../../../../../src/core/transfer-bank/domain/ports/deposit-repository.port';

describe('GetPendingDepositsUseCase', () => {
  let useCase: GetPendingDepositsUseCase;
  let module: TestingModule;
  let depositRepository: jest.Mocked<IDepositRepository>;

  beforeEach(async () => {
    depositRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findPending: jest.fn(),
      completeDeposit: jest.fn(),
    };
    module = await Test.createTestingModule({
      providers: [GetPendingDepositsUseCase, { provide: DEPOSIT_REPOSITORY, useValue: depositRepository }],
    }).compile();
    useCase = module.get(GetPendingDepositsUseCase);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await module.close();
  });

  it('should return pending deposits from the repository', async () => {
    const deposits = [{ id: 'deposit-1', amount: 40, status: 'PENDING' }];
    depositRepository.findPending.mockResolvedValue(deposits);

    const result = await useCase.execute();

    expect(result).toEqual(deposits);
    expect(depositRepository.findPending).toHaveBeenCalledTimes(1);
  });

  it('should return an empty list when there are no pending deposits', async () => {
    depositRepository.findPending.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
