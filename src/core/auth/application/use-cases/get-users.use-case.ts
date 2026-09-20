import { Inject, Injectable } from '@nestjs/common';
import { IGetUsersUseCase } from '../ports/get-users.port';
import { IUserRepository, USER_REPOSITORY } from '../../domain/ports/user-repository.port';

@Injectable()
export class GetUsersUseCase implements IGetUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) { }

  async execute() {
    const users = await this.userRepository.findAll();

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      accounts: user.accounts.map((acc) => ({
        accountNumber: acc.accountNumber,
        balance: acc.balance,
      })),
    }));
  }
}