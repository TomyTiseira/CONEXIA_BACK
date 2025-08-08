import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalitiesController } from './controller/localities.controller';
import { SkillsController } from './controller/skills.controller';
import { DocumentType } from './entities/document-type.entity';
import { Locality } from './entities/locality.entity';
import { ProfileSkill } from './entities/profile-skill.entity';
import { Role } from './entities/role.entity';
import { Skill } from './entities/skill.entity';
import { User } from './entities/user.entity';
import { LocalityRepository } from './repository/locality.repository';
import { ProfileSkillRepository } from './repository/profile-skill.repository';
import { SkillRepository } from './repository/skill.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      DocumentType,
      Skill,
      ProfileSkill,
      Locality,
    ]),
  ],
  controllers: [SkillsController, LocalitiesController],
  providers: [SkillRepository, ProfileSkillRepository, LocalityRepository],
  exports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      DocumentType,
      Skill,
      ProfileSkill,
      Locality,
    ]),
    SkillRepository,
    ProfileSkillRepository,
    LocalityRepository,
  ],
})
export class SharedModule {}
