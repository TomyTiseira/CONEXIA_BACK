import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/users/repository/users.repository';
import { Profile } from '../../../profile/entities/profile.entity';
import { User } from '../../../shared/entities/user.entity';

@Injectable()
export class GetUserWithProfileAndSkillsUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    userId: number,
  ): Promise<{ user: User; profile: Profile } | null> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    // Usar el método que SÍ incluye las skills para recomendaciones
    const profile =
      await this.userRepository.findProfileByUserIdWithSkills(userId);
    if (!profile) {
      return null;
    }

    return { user, profile };
  }
}
