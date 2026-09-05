export const AUTH_HASH_PORT = 'AUTH_HASH_PORT';

export interface IAuthHashPort {
  hash(plainPassword: string): Promise<string>;
  compare(plainPassword: string, hashedPassword: string): Promise<boolean>;
}