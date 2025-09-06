import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserNotFoundByIdException } from 'src/common/exceptions/user.exceptions';
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

  async findByEmailWithDeleted(email: string): Promise<User | null> {
    return this.ormRepository.findOne({
      where: { email },
      withDeleted: true,
    });
  }

  async findAll(): Promise<User[]> {
    return this.ormRepository.find();
  }

  async findById(id: number): Promise<User | null> {
    return this.ormRepository.findOne({ where: { id } });
  }

  async findByIdWithRelations(id: number): Promise<User | null> {
    return this.ormRepository.findOne({
      where: { id },
      relations: ['role', 'profile'],
    });
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
      relations: ['profile', 'profile.profileSkills'],
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

  async findRoleById(id: number): Promise<Role | null> {
    return this.ormRepository.manager.findOne(Role, { where: { id } });
  }

  async findUsersByIds(userIds: number[]): Promise<User[]> {
    return this.ormRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('profile.profileSkills', 'profileSkills')
      .where('user.id IN (:...userIds)', { userIds })
      .getMany();
  }

  async getAllUsersExcept(
    currentUserId: number,
    excludedIds: number[],
    limit: number,
  ): Promise<number[]> {
    const excludedIdsList = excludedIds.length > 0 ? excludedIds : [0];

    const query = this.ormRepository
      .createQueryBuilder('user')
      .select('user.id as user_id')
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere('user.id NOT IN (:...excludedIds)', {
        excludedIds: excludedIdsList,
      })
      .limit(limit);

    const results = await query.getRawMany();
    return results.map((result) => result.user_id);
  }

  ping(): string {
    return 'pong';
  }
}
