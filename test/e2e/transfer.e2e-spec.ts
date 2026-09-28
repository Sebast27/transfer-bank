import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import {
  GET_TRANSFER_STATUS_USE_CASE,
  IGetTransferStatusUseCase,
} from '../../src/core/transfer-bank/application/ports/get-transfer-status.port';
import { PROCESS_TRANSFER_USE_CASE } from '../../src/core/transfer-bank/application/ports/process-transfer.port';
import {
  IQueuePort,
  QUEUE_PORT,
} from '../../src/core/transfer-bank/application/ports/queue.port';
import { ProcessTransferUseCase } from '../../src/core/transfer-bank/application/use-cases/process-transfer.use-case';
import {
  ITransactionRepository,
  TRANSACTION_REPOSITORY,
} from '../../src/core/transfer-bank/domain/ports/transaction-repository.port';
import { TransferController } from '../../src/presentation/controllers/transfer.controller';
import { JwtAuthGuard } from '../../src/presentation/guards/jwt-auth.guard';

describe('Transfer API (integration)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let transactionRepository: jest.Mocked<ITransactionRepository>;
  let queuePort: jest.Mocked<IQueuePort>;
  let getTransferStatusUseCase: jest.Mocked<IGetTransferStatusUseCase>;

  beforeEach(async () => {
    transactionRepository = {
      save: jest.fn(async (transaction) => transaction),
      findById: jest.fn(),
      updateStatus: jest.fn(),
      findAll: jest.fn(),
      completeTransfer: jest.fn(),
      markAsFailed: jest.fn(),
    };
    queuePort = {
      add: jest.fn(),
    };
    getTransferStatusUseCase = {
      execute: jest.fn<IGetTransferStatusUseCase['execute']>()
        .mockImplementation(async (id) => ({
          id,
          status: 'PROCESSING',
        })),
    };

    module = await Test.createTestingModule({
      controllers: [TransferController],
      providers: [
        { provide: PROCESS_TRANSFER_USE_CASE, useClass: ProcessTransferUseCase },
        { provide: GET_TRANSFER_STATUS_USE_CASE, useValue: getTransferStatusUseCase },
        { provide: TRANSACTION_REPOSITORY, useValue: transactionRepository },
        { provide: QUEUE_PORT, useValue: queuePort },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = {
            userId: 'user-123',
            email: 'user@example.com',
            role: 'USER',
          };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('should accept a valid transfer and enqueue it for processing', async () => {
    // Arrange
    const transfer = {
      fromAccount: 'account-1',
      toAccount: 'account-2',
      amount: 125,
      reference: 'invoice-123',
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/api/v1/transfers')
      .send(transfer);

    // Assert
    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({
      message: 'Transfer initiated successfully',
      status: 'PENDING',
      transactionId: expect.any(String),
    });
    expect(transactionRepository.save).toHaveBeenCalledTimes(1);
    expect(queuePort.add).toHaveBeenCalledWith(
      'process-transfer',
      expect.objectContaining({
        fromAccountNumber: transfer.fromAccount,
        toAccountNumber: transfer.toAccount,
        amount: transfer.amount,
      }),
    );
  });

  it('should return a bad request for an invalid transfer amount', async () => {
    // Arrange
    const transfer = {
      fromAccount: 'account-1',
      toAccount: 'account-2',
      amount: 0,
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/api/v1/transfers')
      .send(transfer);

    // Assert
    expect(response.status).toBe(400);
    expect(transactionRepository.save).not.toHaveBeenCalled();
    expect(queuePort.add).not.toHaveBeenCalled();
  });

  it('should return the transfer status for the requested id', async () => {
    // Arrange
    const transferId = 'transaction-123';

    // Act
    const response = await request(app.getHttpServer())
      .get(`/api/v1/transfers/${transferId}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: transferId,
      status: 'PROCESSING',
    });
    expect(getTransferStatusUseCase.execute).toHaveBeenCalledWith(transferId);
  });
});
