import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../repository/users.repository';

@Injectable()
export class PingUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  execute(): string {
    return this.userRepository.ping();
  }
}
