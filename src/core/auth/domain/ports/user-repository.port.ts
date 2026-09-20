export const USER_REPOSITORY = 'USER_REPOSITORY';

export interface IUserRepository {
  findAll(): Promise<Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    accounts: Array<{
      accountNumber: string;
      balance: number;
    }>;
  }>>;

  findById(id: string): Promise<{
    id: string;
    email: string;
    password: string;
    name: string;
    role: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  } | null>;

  findByIdSimple(id: string): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    updatedAt: Date;
  } | null>;

  update(id: string, data: {
    name?: string;
    password?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<{
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    updatedAt: Date;
  }>;
}