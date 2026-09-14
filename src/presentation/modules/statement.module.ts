import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { StatementController } from '../controllers/statement.controller';
import { GenerateStatementUseCase } from '../../core/transfer-bank/application/use-cases/generate-statement.use-case';
import { PrismaStatementRepository } from '../../infrastructure/adapters/prisma/statement-repository.prisma';
import { STATEMENT_REPOSITORY } from '../../core/transfer-bank/domain/ports/statement-repository.port';
import { GENERATE_STATEMENT_USE_CASE } from '../../core/transfer-bank/application/ports/generate-statement.port';
import { BullMQModule } from '@/infrastructure/adapters/bullmq/bullmq.module';

@Module({
  imports: [
    PrismaModule,
    BullMQModule,
  ],
  controllers: [StatementController],
  providers: [
    {
      provide: STATEMENT_REPOSITORY,
      useClass: PrismaStatementRepository,
    },
    {
      provide: GENERATE_STATEMENT_USE_CASE,
      useClass: GenerateStatementUseCase,
    },
  ],
})
export class StatementModule {}