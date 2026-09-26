import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { Readable } from 'stream';
import { IFileStoragePort } from '../../../core/transfer-bank/application/ports/file-storage.port';

@Injectable()
export class LocalFileStorageAdapter implements IFileStoragePort {
    async exists(filePath: string): Promise<boolean> {
        return fs.existsSync(filePath);
    }

    getStream(filePath: string): Readable {
        return fs.createReadStream(filePath);
    }
}