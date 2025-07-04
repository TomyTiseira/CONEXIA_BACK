import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    return this.ormRepository.findOne({ where: { userId } });
  }

  async findById(id: number): Promise<Profile | null> {
    return this.ormRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Profile[]> {
    return this.ormRepository.find();
  }
}
