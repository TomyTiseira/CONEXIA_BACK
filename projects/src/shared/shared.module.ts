import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs, USERS_SERVICE } from 'src/config';
import { PostulationStatus } from '../postulations/entities/postulation-status.entity';
import { Postulation } from '../postulations/entities/postulation.entity';
import { ProjectSkill } from '../projects/entities/project-skill.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectRepository } from '../projects/repositories/project.repository';
import { UsersClientService } from '../projects/services/users-client.service';
import { SkillController } from './controller/skill.controller';
import { Rubro } from './entities/rubro.entity';
import { Skill } from './entities/skill.entity';
import { SkillRepository } from './repository/skill.repository';
import { SkillService } from './services/skill.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectSkill,
      Postulation,
      PostulationStatus,
      Skill,
      Rubro,
    ]),
    ClientsModule.register([
      {
        name: USERS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
  ],
  providers: [
    ProjectRepository,
    UsersClientService,
    SkillRepository,
    SkillService,
  ],
  controllers: [SkillController],
  exports: [ProjectRepository, UsersClientService, SkillService],
})
export class SharedModule {}
