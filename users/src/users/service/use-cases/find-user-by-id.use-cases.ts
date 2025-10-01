import { Injectable } from '@nestjs/common';
import { UserRepository } from 'src/users/repository/users.repository';
import { User } from '../../../shared/entities/user.entity';

@Injectable()
export class FindUserByIdUseCase {
  constructor(private readonly usersRepository: UserRepository) {}

  async execute(userId: number): Promise<User | null> {
    return this.usersRepository.findById(userId);
  }
}

@Injectable()
export class FindUserByIdIncludingDeletedUseCase {
  constructor(private readonly usersRepository: UserRepository) {}

  async execute(userId: number): Promise<User | null> {
    return this.usersRepository.findByIdIncludingDeleted(userId);
  }
}
