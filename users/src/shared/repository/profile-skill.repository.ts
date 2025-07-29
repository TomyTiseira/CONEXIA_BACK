import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProfileSkill } from '../entities/profile-skill.entity';

@Injectable()
export class ProfileSkillRepository extends Repository<ProfileSkill> {
  constructor(private dataSource: DataSource) {
    super(ProfileSkill, dataSource.createEntityManager());
  }

  async createProfileSkills(
    profileId: number,
    skillIds: number[],
  ): Promise<ProfileSkill[]> {
    const profileSkills = skillIds.map((skillId) =>
      this.create({ profileId, skillId }),
    );
    return this.save(profileSkills);
  }

  async deleteByProfileId(profileId: number): Promise<void> {
    await this.delete({ profileId });
  }

  async findByProfileId(profileId: number): Promise<ProfileSkill[]> {
    return this.find({
      where: { profileId },
      relations: ['skill'],
    });
  }
}
