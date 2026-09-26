import { DOWNLOAD_STATEMENT_USE_CASE } from '@/core/transfer-bank/application/ports/download-statement.port';
import { FILE_STORAGE_PORT } from '@/core/transfer-bank/application/ports/file-storage.port';
import { GET_STATEMENT_STATUS_USE_CASE } from '@/core/transfer-bank/application/ports/get-statement-status.port';
import { DownloadStatementUseCase } from '@/core/transfer-bank/application/use-cases/download-statement.use-case';
import { GetStatementStatusUseCase } from '@/core/transfer-bank/application/use-cases/get-statement-status.use-case';
import { LocalFileStorageAdapter } from '@/infrastructure/adapters/file-storage/local-file-storage.adapter';
import { Module } from '@nestjs/common';
import { GENERATE_STATEMENT_USE_CASE } from '../../core/transfer-bank/application/ports/generate-statement.port';
import { GenerateStatementUseCase } from '../../core/transfer-bank/application/use-cases/generate-statement.use-case';
import { ACCOUNT_REPOSITORY } from '../../core/transfer-bank/domain/ports/account-repository.port';
import { STATEMENT_REPOSITORY } from '../../core/transfer-bank/domain/ports/statement-repository.port';
import { BullMQModule } from '../../infrastructure/adapters/bullmq/bullmq.module';
import { PrismaAccountRepository } from '../../infrastructure/adapters/prisma/account-repository.prisma';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { PrismaStatementRepository } from '../../infrastructure/adapters/prisma/statement-repository.prisma';
import { StatementController } from '../controllers/statement.controller';

@Module({
  imports: [
    PrismaModule,
    BullMQModule,
  ],
  controllers: [StatementController],
  providers: [

    { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository, },
    { provide: STATEMENT_REPOSITORY, useClass: PrismaStatementRepository, },
    { provide: GENERATE_STATEMENT_USE_CASE, useClass: GenerateStatementUseCase, },
    { provide: GET_STATEMENT_STATUS_USE_CASE, useClass: GetStatementStatusUseCase },
    { provide: DOWNLOAD_STATEMENT_USE_CASE, useClass: DownloadStatementUseCase },
    { provide: FILE_STORAGE_PORT, useClass: LocalFileStorageAdapter },
  ],
})
export class StatementModule { }