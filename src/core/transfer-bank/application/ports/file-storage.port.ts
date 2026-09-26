import { Readable } from 'stream';

export const FILE_STORAGE_PORT = 'FILE_STORAGE_PORT';

export interface IFileStoragePort {
    exists(filePath: string): Promise<boolean>;
    getStream(filePath: string): Readable;
}