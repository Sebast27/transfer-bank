import { Readable } from 'stream';
export const DOWNLOAD_STATEMENT_USE_CASE = 'DOWNLOAD_STATEMENT_USE_CASE';

export interface DownloadStatementResult {
    stream: Readable;
    fileName: string;
    contentType: string;
}

export interface IDownloadStatementUseCase {
    execute(statementId: string, userId: string, userRole: string): Promise<DownloadStatementResult>;
}