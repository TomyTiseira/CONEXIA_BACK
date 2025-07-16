import { Injectable } from '@nestjs/common';
import { UserNotFoundByIdException } from 'src/common/exceptions/user.exceptions';
import { User } from 'src/shared/entities/user.entity';
import { UserRepository } from 'src/users/repository/users.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(reason: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundByIdException(id);
    }
    return this.userRepository.deleteUser(user, reason);
  }
}
