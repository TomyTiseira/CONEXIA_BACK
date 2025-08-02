import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/users/repository/users.repository';
import { Profile } from '../../../profile/entities/profile.entity';
import { User } from '../../../shared/entities/user.entity';

@Injectable()
export class GetUserWithProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    userId: number,
  ): Promise<{ user: User; profile: Profile } | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const profile = await this.userRepository.findProfileByUserId(userId);
    if (!profile) {
      return null;
    }

    return { user, profile };
  }
}
