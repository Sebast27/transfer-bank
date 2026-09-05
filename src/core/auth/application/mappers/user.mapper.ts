import { UserEntity } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../dto/user-response.dto';

export class UserMapper {
  static toResponseDto(user: UserEntity): UserResponseDto {
    return new UserResponseDto({
      id: user.getId(),
      email: user.getEmail(),
      name: user.getName(),
      role: user.getRole(),
      initials: user.getInitials(),
      isCorporate: user.isCorporateEmail(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt(),
    });
  }

  static toResponseDtoList(users: UserEntity[]): UserResponseDto[] {
    return users.map(user => UserMapper.toResponseDto(user));
  }
}