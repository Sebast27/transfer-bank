import { Module } from '@nestjs/common';
import { APPROVE_DEPOSIT_USE_CASE } from '../../core/transfer-bank/application/ports/approve-deposit.port';
import { GET_DEPOSIT_STATUS_USE_CASE } from '../../core/transfer-bank/application/ports/get-deposit-status.port';
import { GET_PENDING_DEPOSITS_USE_CASE } from '../../core/transfer-bank/application/ports/get-pending-deposits.port';
import { REQUEST_DEPOSIT_USE_CASE } from '../../core/transfer-bank/application/ports/request-deposit.port';
import { ApproveDepositUseCase } from '../../core/transfer-bank/application/use-cases/approve-deposit.use-case';
import { GetDepositStatusUseCase } from '../../core/transfer-bank/application/use-cases/get-deposit-status.use-case';
import { GetPendingDepositsUseCase } from '../../core/transfer-bank/application/use-cases/get-pending-deposits.use-case';
import { RequestDepositUseCase } from '../../core/transfer-bank/application/use-cases/request-deposit.use-case';
import { ACCOUNT_REPOSITORY } from '../../core/transfer-bank/domain/ports/account-repository.port';
import { DEPOSIT_REPOSITORY } from '../../core/transfer-bank/domain/ports/deposit-repository.port';
import { BullMQModule } from '../../infrastructure/adapters/bullmq/bullmq.module';
import { PrismaAccountRepository } from '../../infrastructure/adapters/prisma/account-repository.prisma';
import { PrismaDepositRepository } from '../../infrastructure/adapters/prisma/deposit-repository.prisma';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { DepositController } from '../controllers/deposit.controller';

@Module({
  imports: [
    PrismaModule,
    BullMQModule,
  ],
  controllers: [DepositController],
  providers: [

    // Repositories
    { provide: DEPOSIT_REPOSITORY, useClass: PrismaDepositRepository, },
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository, },

    // Use cases
    { provide: REQUEST_DEPOSIT_USE_CASE, useClass: RequestDepositUseCase, },
    { provide: APPROVE_DEPOSIT_USE_CASE, useClass: ApproveDepositUseCase, },
    { provide: GET_DEPOSIT_STATUS_USE_CASE, useClass: GetDepositStatusUseCase, },
    { provide: GET_PENDING_DEPOSITS_USE_CASE, useClass: GetPendingDepositsUseCase, },
  ],
})
export class DepositModule { }