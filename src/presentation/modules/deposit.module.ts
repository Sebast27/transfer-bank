import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { BullMQModule } from '../../infrastructure/adapters/bullmq/bullmq.module';
import { DepositController } from '../controllers/deposit.controller';
import { RequestDepositUseCase } from '../../core/transfer-bank/application/use-cases/request-deposit.use-case';
import { ApproveDepositUseCase } from '../../core/transfer-bank/application/use-cases/approve-deposit.use-case';
import { PrismaDepositRepository } from '../../infrastructure/adapters/prisma/deposit-repository.prisma';
import { DEPOSIT_REPOSITORY } from '../../core/transfer-bank/domain/ports/deposit-repository.port';
import { REQUEST_DEPOSIT_USE_CASE } from '../../core/transfer-bank/application/ports/request-deposit.port';
import { APPROVE_DEPOSIT_USE_CASE } from '../../core/transfer-bank/application/ports/approve-deposit.port';

@Module({
  imports: [
    PrismaModule,
    BullMQModule,
  ],
  controllers: [DepositController],
  providers: [
    {
      provide: DEPOSIT_REPOSITORY,
      useClass: PrismaDepositRepository,
    },
    {
      provide: REQUEST_DEPOSIT_USE_CASE,
      useClass: RequestDepositUseCase,
    },
    {
      provide: APPROVE_DEPOSIT_USE_CASE,
      useClass: ApproveDepositUseCase,
    },
  ],
})
export class DepositModule {}