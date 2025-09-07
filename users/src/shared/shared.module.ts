import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { COMMUNITIES_SERVICE, envs, PROJECTS_SERVICE } from 'src/config';
import { UserBaseService } from '../common/services/user-base.service';
import { Profile } from '../profile/entities/profile.entity';
import { ProfileRepository } from '../profile/repository/profile.repository';
import { UserRepository } from '../users/repository/users.repository';
import { LocalitiesController } from './controller/localities.controller';
import { DocumentType } from './entities/document-type.entity';
import { Locality } from './entities/locality.entity';
import { ProfileSkill } from './entities/profile-skill.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { LocalityRepository } from './repository/locality.repository';
import { ProfileSkillRepository } from './repository/profile-skill.repository';
import { ConnectionInfoService } from './services/connection-info.service';
import { ConnectionStatusService } from './services/connection-status.service';
import { SkillsValidationService } from './services/skills-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      DocumentType,
      ProfileSkill,
      Locality,
      Profile,
    ]),
    ClientsModule.register([
      {
        name: PROJECTS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
      {
        name: COMMUNITIES_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
  ],
  controllers: [LocalitiesController],
  providers: [
    ProfileSkillRepository,
    LocalityRepository,
    SkillsValidationService,
    ConnectionStatusService,
    ConnectionInfoService,
    UserRepository,
    UserBaseService,
    ProfileRepository,
  ],
  exports: [
    ProfileSkillRepository,
    LocalityRepository,
    SkillsValidationService,
    ConnectionStatusService,
    ConnectionInfoService,
    UserRepository,
    UserBaseService,
    ProfileRepository,
  ],
})
export class SharedModule {}
