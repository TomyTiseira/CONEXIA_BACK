import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SkillsController } from './controller/skills.controller';
import { DocumentType } from './entities/document-type.entity';
import { ProfileSkill } from './entities/profile-skill.entity';
import { Role } from './entities/role.entity';
import { Skill } from './entities/skill.entity';
import { User } from './entities/user.entity';
import { ProfileSkillRepository } from './repository/profile-skill.repository';
import { SkillRepository } from './repository/skill.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, DocumentType, Skill, ProfileSkill]),
  ],
  controllers: [SkillsController],
  providers: [SkillRepository, ProfileSkillRepository],
  exports: [
    TypeOrmModule.forFeature([User, Role, DocumentType, Skill, ProfileSkill]),
    SkillRepository,
    ProfileSkillRepository,
  ],
})
export class SharedModule {}
