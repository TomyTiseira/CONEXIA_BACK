import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from 'src/profile/entities/profile.entity';
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

  async clearPasswordResetFields(id: number): Promise<User | null> {
    await this.ormRepository.update(id, {
      passwordResetCode: '',
      passwordResetCodeExpires: new Date('1970-01-01'),
    });
    return this.ormRepository.findOne({ where: { id } });
  }

  async clearVerificationFields(id: number): Promise<User | null> {
    await this.ormRepository.update(id, {
      verificationCode: '',
      verificationCodeExpires: new Date('1970-01-01'),
    });
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

  async findRoleByUserId(userId: number): Promise<Role | null> {
    const user = await this.ormRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    return user?.role || null;
  }

  async findProfileByUserId(userId: number): Promise<Profile | null> {
    const user = await this.ormRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    return user?.profile || null;
  }

  async deleteUser(user: User, reason: string): Promise<void> {
    await this.ormRepository.update(user.id, {
      deletedAt: new Date(),
      deletedReason: reason || 'No reason provided',
    });
  }

  async deleteProfile(profile: Profile): Promise<void> {
    await this.ormRepository.manager.softDelete(Profile, profile.id);
  }

  ping(): string {
    return 'pong';
  }
}
