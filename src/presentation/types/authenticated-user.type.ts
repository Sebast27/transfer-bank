export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
    name: string;
}