// src/users/repository/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { Users } from '../entities/users.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(Users)
    private readonly ormRepository: Repository<Users>,
  ) {}

  async create(user: Partial<Users>): Promise<Users> {
    const entity = this.ormRepository.create(user);
    return this.ormRepository.save(entity);
  }

  async update(id: number, user: Partial<Users>): Promise<Users | null> {
    await this.ormRepository.update(id, user);
    return this.ormRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<Users | null> {
    return this.ormRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<Users[]> {
    return this.ormRepository.find();
  }

  async findById(id: number): Promise<Users | null> {
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
