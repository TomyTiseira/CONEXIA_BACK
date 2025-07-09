import { Injectable } from '@nestjs/common';
import { User } from '../../shared/entities/user.entity';
import { UserRepository } from '../../users/repository/users.repository';

@Injectable()
export class AuthRepository {
  constructor(private readonly userRepository: UserRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }
}
