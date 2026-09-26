import { Module } from '@nestjs/common';
import { GET_USERS_USE_CASE } from '../../core/auth/application/ports/get-users.port';
import { UPDATE_USER_USE_CASE } from '../../core/auth/application/ports/update-user.port';
import { GetUsersUseCase } from '../../core/auth/application/use-cases/get-users.use-case';
import { UpdateUserUseCase } from '../../core/auth/application/use-cases/update-user.use-case';
import { USER_REPOSITORY } from '../../core/auth/domain/ports/user-repository.port';
import { CREATE_ACCOUNT_USE_CASE } from '../../core/transfer-bank/application/ports/create-account.port';
import { GET_ALL_ACCOUNTS_USE_CASE } from '../../core/transfer-bank/application/ports/get-all-accounts.port';
import { GET_ALL_TRANSFERS_USE_CASE } from '../../core/transfer-bank/application/ports/get-all-transfers.port';
import { UPDATE_ACCOUNT_STATUS_USE_CASE } from '../../core/transfer-bank/application/ports/update-account-status.port';
import { CreateAccountUseCase } from '../../core/transfer-bank/application/use-cases/create-account.use-case';
import { GetAllAccountsUseCase } from '../../core/transfer-bank/application/use-cases/get-all-accounts.use-case';
import { GetAllTransfersUseCase } from '../../core/transfer-bank/application/use-cases/get-all-transfers.use-case';
import { UpdateAccountStatusUseCase } from '../../core/transfer-bank/application/use-cases/update-account-status.use-case';
import { ACCOUNT_REPOSITORY } from '../../core/transfer-bank/domain/ports/account-repository.port';
import { TRANSACTION_REPOSITORY } from '../../core/transfer-bank/domain/ports/transaction-repository.port';
import { PrismaAccountRepository } from '../../infrastructure/adapters/prisma/account-repository.prisma';
import { PrismaModule } from '../../infrastructure/adapters/prisma/prisma.module';
import { PrismaTransactionRepository } from '../../infrastructure/adapters/prisma/transaction.repository.prisma';
import { PrismaUserRepository } from '../../infrastructure/adapters/prisma/user-repository.prisma';
import { AdminController } from '../controllers/admin.controller';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthModule } from './auth.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
    ],
    controllers: [AdminController],
    providers: [
        // Repositories
        { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
        { provide: ACCOUNT_REPOSITORY, useClass: PrismaAccountRepository },
        { provide: TRANSACTION_REPOSITORY, useClass: PrismaTransactionRepository },

        // Auth use cases
        { provide: GET_USERS_USE_CASE, useClass: GetUsersUseCase },
        { provide: UPDATE_USER_USE_CASE, useClass: UpdateUserUseCase },

        // Transfer-bank use cases
        { provide: CREATE_ACCOUNT_USE_CASE, useClass: CreateAccountUseCase },
        { provide: UPDATE_ACCOUNT_STATUS_USE_CASE, useClass: UpdateAccountStatusUseCase },
        { provide: GET_ALL_TRANSFERS_USE_CASE, useClass: GetAllTransfersUseCase },
        { provide: GET_ALL_ACCOUNTS_USE_CASE, useClass: GetAllAccountsUseCase },

        // Guards
        JwtAuthGuard,
        RolesGuard,
    ],
})
export class AdminModule { }