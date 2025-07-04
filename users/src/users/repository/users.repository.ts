// src/users/repository/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../shared/entities/role.entity';
import { User } from '../../shared/entities/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly ormRepository: Repository<User>,
  ) {}

  async create(user: Partial<User>): Promise<User> {
    const entity = this.ormRepository.create(user);
    return this.ormRepository.save(entity);
  }

  async update(id: number, user: Partial<User>): Promise<User | null> {
    await this.ormRepository.update(id, user);
    return this.ormRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.ormRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return this.ormRepository.find();
  }

  async findById(id: number): Promise<User | null> {
    return this.ormRepository.findOne({ where: { id } });
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return this.ormRepository.manager.findOne(Role, { where: { name } });
  }

  ping(): string {
    return 'pong';
  }

  // Otros métodos según necesites
}
