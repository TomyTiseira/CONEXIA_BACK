import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../repository/users.repository';

@Injectable()
export class GetUsersSkillsOnlyUseCase {
  constructor(private readonly usersRepository: UserRepository) {}

  async execute(
    userIds: number[],
  ): Promise<Array<{ userId: number; skillIds: number[] }>> {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    return await this.usersRepository.getUsersSkillsOnly(userIds);
  }
}
