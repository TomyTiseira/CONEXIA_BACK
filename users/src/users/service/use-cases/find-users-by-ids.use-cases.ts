import { Injectable } from '@nestjs/common';
import { User } from '../../../shared/entities/user.entity';
import { UserRepository } from '../../repository/users.repository';

@Injectable()
export class FindUsersByIdsUseCase {
  constructor(private readonly usersRepository: UserRepository) {}

  async execute(userIds: number[]): Promise<User[]> {
    return this.usersRepository.findUsersByIds(userIds);
  }
}
