import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IStatementRepository, STATEMENT_REPOSITORY } from '../../domain/ports/statement-repository.port';
import { IDownloadStatementUseCase } from '../ports/download-statement.port';
import { FILE_STORAGE_PORT, IFileStoragePort } from '../ports/file-storage.port';

@Injectable()
export class DownloadStatementUseCase implements IDownloadStatementUseCase {
    constructor(
        @Inject(STATEMENT_REPOSITORY)
        private readonly statementRepository: IStatementRepository,
        @Inject(FILE_STORAGE_PORT)
        private readonly fileStorage: IFileStoragePort,
    ) { }

    async execute(statementId: string, userId: string, userRole: string) {
        const statement = await this.statementRepository.findById(statementId);

        if (!statement) {
            throw new NotFoundException(`Statement ${statementId} not found`);
        }

        if (statement.accountUserId !== userId && userRole !== 'ADMIN') {
            throw new ForbiddenException('You do not have access to this statement');
        }

        if (statement.status !== 'COMPLETED') {
            throw new BadRequestException(`Statement is not ready. Current status: ${statement.status}`);
        }

        if (!statement.filePath) {
            throw new NotFoundException('Statement file not found');
        }

        if (!(await this.fileStorage.exists(statement.filePath))) {
            throw new NotFoundException('Statement file does not exist on disk');
        }

        return {
            stream: this.fileStorage.getStream(statement.filePath),
            fileName: `statement-${statement.id}.pdf`,
            contentType: 'application/pdf',
        };
    }
}