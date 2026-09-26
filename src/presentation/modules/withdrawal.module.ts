import { Module } from '@nestjs/common';
import { REQUEST_WITHDRAWAL_USE_CASE } from '../../core/transfer-bank/application/ports/request-withdrawal.port';
import { RequestWithdrawalUseCase } from '../../core/transfer-bank/application/use-cases/request-withdrawal.use-case';
import { ACCOUNT_REPOSITORY } from '../../core/transfer-bank/domain/ports/account-repository.port';
import { WITHDRAWAL_REPOSITORY } from '../../core/transfer-bank/domain/ports/withdrawal-repository.port';
import { BullMQModule } from '../../infrastructure/adapters/bullmq/bullmq.module';
import { PrismaAccountRepository } from '../../infrastructure/adapters/prisma/account-repository.prisma';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { PrismaWithdrawalRepository } from '../../infrastructure/adapters/prisma/withdrawal-repository.prisma';
import { WithdrawalController } from '../controllers/withdrawal.controller';

@Module({
  imports: [
    PrismaModule,
    BullMQModule,
  ],
  controllers: [WithdrawalController],
  providers: [
    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository, },
    { provide: WITHDRAWAL_REPOSITORY, useClass: PrismaWithdrawalRepository, },
    { provide: REQUEST_WITHDRAWAL_USE_CASE, useClass: RequestWithdrawalUseCase, },
  ],
})
export class WithdrawalModule { }