import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserNotFoundByIdException } from 'src/common/exceptions/user.exceptions';
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

  async update(id: number, user: Partial<User>): Promise<User> {
    const existingUser = await this.ormRepository.findOne({ where: { id } });
    if (!existingUser) {
      throw new UserNotFoundByIdException(id);
    }

    // Merge los datos existentes con los nuevos datos
    const updatedUser = this.ormRepository.merge(existingUser, user);
    return this.ormRepository.save(updatedUser);
  }

  async clearPasswordResetFields(id: number): Promise<User> {
    const existingUser = await this.ormRepository.findOne({ where: { id } });
    if (!existingUser) {
      throw new UserNotFoundByIdException(id);
    }

    const updatedUser = this.ormRepository.merge(existingUser, {
      passwordResetCode: '',
      passwordResetCodeExpires: new Date('1970-01-01'),
    });
    return this.ormRepository.save(updatedUser);
  }

  async clearVerificationFields(id: number): Promise<User> {
    const existingUser = await this.ormRepository.findOne({ where: { id } });
    if (!existingUser) {
      throw new UserNotFoundByIdException(id);
    }

    const updatedUser = this.ormRepository.merge(existingUser, {
      verificationCode: '',
      verificationCodeExpires: new Date('1970-01-01'),
    });
    return this.ormRepository.save(updatedUser);
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

  async findRoleById(id: number): Promise<Role | null> {
    return this.ormRepository.manager.findOne(Role, { where: { id } });
  }

  ping(): string {
    return 'pong';
  }
}
