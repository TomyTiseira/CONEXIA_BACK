import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';

@Injectable()
export class ProfileRepository {
  constructor(
    @InjectRepository(Profile)
    private readonly ormRepository: Repository<Profile>,
  ) {}

  async create(profile: Partial<Profile>): Promise<Profile> {
    const entity = this.ormRepository.create(profile);
    return this.ormRepository.save(entity);
  }

  async update(id: number, profile: Partial<Profile>): Promise<Profile | null> {
    await this.ormRepository.update(id, profile);
    return this.ormRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: number): Promise<Profile | null> {
    return this.ormRepository.findOne({
      select: {
        id: true,
        name: true,
        lastName: true,
        phoneNumber: true,
        country: true,
        state: true,
        birthDate: true,
        profilePicture: true,
        coverPicture: true,
        skills: true,
        description: true,
        experience: true,
        socialLinks: true,
      },
      where: { userId, deletedAt: IsNull() },
    });
  }

  async findById(id: number): Promise<Profile | null> {
    return this.ormRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Profile[]> {
    return this.ormRepository.find();
  }
}
