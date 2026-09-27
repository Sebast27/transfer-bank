import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import request from 'supertest';
import { GET_USERS_USE_CASE } from '../../src/core/auth/application/ports/get-users.port';
import { UPDATE_USER_USE_CASE } from '../../src/core/auth/application/ports/update-user.port';
import { APPROVE_DEPOSIT_USE_CASE } from '../../src/core/transfer-bank/application/ports/approve-deposit.port';
import { CREATE_ACCOUNT_USE_CASE } from '../../src/core/transfer-bank/application/ports/create-account.port';
import { DOWNLOAD_STATEMENT_USE_CASE } from '../../src/core/transfer-bank/application/ports/download-statement.port';
import { GENERATE_STATEMENT_USE_CASE } from '../../src/core/transfer-bank/application/ports/generate-statement.port';
import { GET_ACCOUNT_BALANCE_USE_CASE } from '../../src/core/transfer-bank/application/ports/get-account-balance.port';
import { GET_ACCOUNT_TRANSACTIONS_USE_CASE } from '../../src/core/transfer-bank/application/ports/get-account-transactions.port';
import { GET_ALL_ACCOUNTS_USE_CASE } from '../../src/core/transfer-bank/application/ports/get-all-accounts.port';
import { GET_ALL_TRANSFERS_USE_CASE } from '../../src/core/transfer-bank/application/ports/get-all-transfers.port';
import { GET_DEPOSIT_STATUS_USE_CASE } from '../../src/core/transfer-bank/application/ports/get-deposit-status.port';
import { GET_PENDING_DEPOSITS_USE_CASE } from '../../src/core/transfer-bank/application/ports/get-pending-deposits.port';
import { GET_STATEMENT_STATUS_USE_CASE } from '../../src/core/transfer-bank/application/ports/get-statement-status.port';
import { GET_WITHDRAWAL_STATUS_USE_CASE } from '../../src/core/transfer-bank/application/ports/get-withdrawal-status.port';
import { REQUEST_DEPOSIT_USE_CASE } from '../../src/core/transfer-bank/application/ports/request-deposit.port';
import { REQUEST_WITHDRAWAL_USE_CASE } from '../../src/core/transfer-bank/application/ports/request-withdrawal.port';
import { UPDATE_ACCOUNT_STATUS_USE_CASE } from '../../src/core/transfer-bank/application/ports/update-account-status.port';
import { PrismaService } from '../../src/infrastructure/adapters/prisma/prisma.service';
import { AccountController } from '../../src/presentation/controllers/account.controller';
import { AdminController } from '../../src/presentation/controllers/admin.controller';
import { DepositController } from '../../src/presentation/controllers/deposit.controller';
import { HealthController } from '../../src/presentation/controllers/health.controller';
import { StatementController } from '../../src/presentation/controllers/statement.controller';
import { WithdrawalController } from '../../src/presentation/controllers/withdrawal.controller';
import { JwtAuthGuard } from '../../src/presentation/guards/jwt-auth.guard';

describe('Protected controllers API (integration)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let useCases: Map<string, { execute: jest.Mock }>;

  const resultForToken = (token: string) => {
    switch (token) {
      case GET_ACCOUNT_BALANCE_USE_CASE:
        return { accountNumber: 'ACC-001', balance: 150 };
      case GET_ACCOUNT_TRANSACTIONS_USE_CASE:
        return [{ id: 'transaction-1', amount: 25 }];
      case GET_ALL_ACCOUNTS_USE_CASE:
        return [{ accountNumber: 'ACC-001' }];
      case GET_ALL_TRANSFERS_USE_CASE:
        return [{ id: 'transfer-1' }];
      case GET_USERS_USE_CASE:
        return [{ id: 'user-1', email: 'user@example.com' }];
      case GET_PENDING_DEPOSITS_USE_CASE:
        return [{ id: 'deposit-1', status: 'PENDING' }];
      case GET_DEPOSIT_STATUS_USE_CASE:
        return { id: 'deposit-1', status: 'PENDING' };
      case GET_WITHDRAWAL_STATUS_USE_CASE:
        return { id: 'withdrawal-1', status: 'PENDING' };
      case GET_STATEMENT_STATUS_USE_CASE:
        return { id: 'statement-1', status: 'READY' };
      case CREATE_ACCOUNT_USE_CASE:
        return { accountNumber: 'ACC-001', status: 'ACTIVE' };
      case UPDATE_ACCOUNT_STATUS_USE_CASE:
        return { accountNumber: 'ACC-001', status: 'FROZEN' };
      case UPDATE_USER_USE_CASE:
        return { id: 'user-1', name: 'Updated User' };
      case REQUEST_DEPOSIT_USE_CASE:
        return { id: 'deposit-1', status: 'PENDING' };
      case APPROVE_DEPOSIT_USE_CASE:
        return { id: 'deposit-1', status: 'APPROVED' };
      case REQUEST_WITHDRAWAL_USE_CASE:
        return { id: 'withdrawal-1', status: 'PENDING' };
      case GENERATE_STATEMENT_USE_CASE:
        return { id: 'statement-1', status: 'PENDING' };
      case DOWNLOAD_STATEMENT_USE_CASE:
        return {
          stream: Buffer.from('statement-pdf'),
          fileName: 'statement.pdf',
          contentType: 'application/pdf',
        };
      default:
        throw new Error(`No integration-test result configured for ${token}`);
    }
  };

  beforeEach(async () => {
    useCases = new Map();
    const useCaseTokens = [
      GET_ACCOUNT_BALANCE_USE_CASE,
      GET_ACCOUNT_TRANSACTIONS_USE_CASE,
      GET_ALL_ACCOUNTS_USE_CASE,
      GET_ALL_TRANSFERS_USE_CASE,
      GET_USERS_USE_CASE,
      GET_PENDING_DEPOSITS_USE_CASE,
      GET_DEPOSIT_STATUS_USE_CASE,
      GET_WITHDRAWAL_STATUS_USE_CASE,
      GET_STATEMENT_STATUS_USE_CASE,
      CREATE_ACCOUNT_USE_CASE,
      UPDATE_ACCOUNT_STATUS_USE_CASE,
      UPDATE_USER_USE_CASE,
      REQUEST_DEPOSIT_USE_CASE,
      APPROVE_DEPOSIT_USE_CASE,
      REQUEST_WITHDRAWAL_USE_CASE,
      GENERATE_STATEMENT_USE_CASE,
      DOWNLOAD_STATEMENT_USE_CASE,
    ];
    const providers = useCaseTokens.map((token) => {
      const useCase = { execute: jest.fn(async () => resultForToken(token)) };
      useCases.set(token, useCase);
      return { provide: token, useValue: useCase };
    });

    module = await Test.createTestingModule({
      controllers: [
        AccountController,
        AdminController,
        DepositController,
        HealthController,
        StatementController,
        WithdrawalController,
      ],
      providers: [
        ...providers,
        {
          provide: PrismaService,
          useValue: { $queryRaw: jest.fn(async () => 1) },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const requestContext = context.switchToHttp().getRequest();
          const role = requestContext.headers['x-test-role'];
          if (!role) {
            throw new UnauthorizedException('Missing test identity');
          }
          requestContext.user = {
            id: 'test-user-id',
            email: 'test@example.com',
            role,
            name: 'Test User',
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

  describe('authenticated user routes', () => {
    it('should protect account, deposit, withdrawal, and statement routes', async () => {
      // Arrange
      const userHeader = { 'x-test-role': 'USER' };

      // Act
      const balance = await request(app.getHttpServer())
        .get('/api/v1/accounts/ACC-001')
        .set(userHeader);
      const deposit = await request(app.getHttpServer())
        .post('/api/v1/deposits')
        .set(userHeader)
        .send({ accountNumber: 'ACC-001', amount: 25 });
      const withdrawal = await request(app.getHttpServer())
        .post('/api/v1/withdrawals')
        .set(userHeader)
        .send({ accountNumber: 'ACC-001', amount: 10 });
      const statement = await request(app.getHttpServer())
        .post('/api/v1/statements')
        .set(userHeader)
        .send({
          accountNumber: 'ACC-001',
          periodStart: '2025-01-01',
          periodEnd: '2025-01-31',
        });

      // Assert
      expect(balance.status).toBe(200);
      expect(balance.body).toEqual({ accountNumber: 'ACC-001', balance: 150 });
      expect(deposit.status).toBe(202);
      expect(withdrawal.status).toBe(202);
      expect(statement.status).toBe(202);
      expect(useCases.get(REQUEST_DEPOSIT_USE_CASE)!.execute).toHaveBeenCalledWith(
        expect.objectContaining({ accountNumber: 'ACC-001', amount: 25 }),
        'test-user-id',
      );
      expect(useCases.get(REQUEST_WITHDRAWAL_USE_CASE)!.execute).toHaveBeenCalledWith(
        expect.objectContaining({ accountNumber: 'ACC-001', amount: 10 }),
        'test-user-id',
      );
    });

    it('should reject requests without an authenticated identity', async () => {
      // Arrange
      const route = '/api/v1/accounts/ACC-001';

      // Act
      const response = await request(app.getHttpServer()).get(route);

      // Assert
      expect(response.status).toBe(401);
      expect(useCases.get(GET_ACCOUNT_BALANCE_USE_CASE)!.execute).not.toHaveBeenCalled();
    });
  });

  describe('admin role restrictions', () => {
    it('should deny a regular user access to admin-only routes', async () => {
      // Arrange
      const route = '/api/v1/admin/users';

      // Act
      const response = await request(app.getHttpServer())
        .get(route)
        .set('x-test-role', 'USER');

      // Assert
      expect(response.status).toBe(403);
      expect(useCases.get(GET_USERS_USE_CASE)!.execute).not.toHaveBeenCalled();
    });

    it('should allow an admin to access admin routes and pending deposits', async () => {
      // Arrange
      const adminHeader = { 'x-test-role': 'ADMIN' };

      // Act
      const users = await request(app.getHttpServer())
        .get('/api/v1/admin/users')
        .set(adminHeader);
      const pendingDeposits = await request(app.getHttpServer())
        .get('/api/v1/deposits/admin/pending')
        .set(adminHeader);

      // Assert
      expect(users.status).toBe(200);
      expect(users.body).toEqual([{ id: 'user-1', email: 'user@example.com' }]);
      expect(pendingDeposits.status).toBe(200);
      expect(pendingDeposits.body).toEqual([
        { id: 'deposit-1', status: 'PENDING' },
      ]);
      expect(useCases.get(GET_USERS_USE_CASE)!.execute).toHaveBeenCalledTimes(1);
      expect(useCases.get(GET_PENDING_DEPOSITS_USE_CASE)!.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('health route', () => {
    it('should expose the health check endpoint', async () => {
      // Arrange

      // Act
      const response = await request(app.getHttpServer()).get('/api/v1/health');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'ok',
        database: 'connected',
      });
    });
  });
});
