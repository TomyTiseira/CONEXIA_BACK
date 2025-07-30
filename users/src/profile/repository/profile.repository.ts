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
        profession: true,
        phoneNumber: true,
        documentTypeId: true,
        documentNumber: true,
        country: true,
        state: true,
        birthDate: true,
        profilePicture: true,
        coverPicture: true,
        description: true,
        experience: true,
        socialLinks: true,
        education: true,
        certifications: true,
      },
      where: { userId, deletedAt: IsNull() },
      relations: ['profileSkills', 'profileSkills.skill'],
    });
  }

  async findById(id: number): Promise<Profile | null> {
    return this.ormRepository.findOne({
      where: { id },
      relations: ['profileSkills', 'profileSkills.skill'],
    });
  }

  async findAll(): Promise<Profile[]> {
    return this.ormRepository.find({
      relations: ['profileSkills', 'profileSkills.skill'],
    });
  }

  async findByDocumentNumber(
    documentTypeId: number,
    documentNumber: string,
  ): Promise<Profile | null> {
    return this.ormRepository.findOne({
      where: { documentTypeId, documentNumber },
      withDeleted: true,
      relations: ['profileSkills', 'profileSkills.skill'],
    });
  }
}
