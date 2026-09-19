import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { BullMQModule } from '../../infrastructure/adapters/bullmq/bullmq.module';
import { WithdrawalController } from '../controllers/withdrawal.controller';
import { RequestWithdrawalUseCase } from '../../core/transfer-bank/application/use-cases/request-withdrawal.use-case';
import { PrismaWithdrawalRepository } from '../../infrastructure/adapters/prisma/withdrawal-repository.prisma';
import { WITHDRAWAL_REPOSITORY } from '../../core/transfer-bank/domain/ports/withdrawal-repository.port';
import { REQUEST_WITHDRAWAL_USE_CASE } from '../../core/transfer-bank/application/ports/request-withdrawal.port';

@Module({
  imports: [
    PrismaModule,
    BullMQModule,
  ],
  controllers: [WithdrawalController],
  providers: [
    {
      provide: WITHDRAWAL_REPOSITORY,
      useClass: PrismaWithdrawalRepository,
    },
    {
      provide: REQUEST_WITHDRAWAL_USE_CASE,
      useClass: RequestWithdrawalUseCase,
    },
  ],
})
export class WithdrawalModule {}