import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IAuthHashPort } from '../../../core/auth/application/ports/auth-hash.port';

@Injectable()
export class BcryptHashAdapter implements IAuthHashPort {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 10);
  }

  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}