import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs, USERS_SERVICE } from 'src/config';
import { UsersClientService } from '../common/services/users-client.service';
import { PostulationStatus } from '../postulations/entities/postulation-status.entity';
import { Postulation } from '../postulations/entities/postulation.entity';
import { ProjectSkill } from '../projects/entities/project-skill.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectRole } from '../projects/entities/project-role.entity';
import { RoleQuestion } from '../projects/entities/role-question.entity';
import { RoleQuestionOption } from '../projects/entities/role-question-option.entity';
import { RoleEvaluation } from '../projects/entities/role-evaluation.entity';
import { PostulationAnswer } from '../postulations/entities/postulation-answer.entity';
import { ProjectRepository } from '../projects/repositories/project.repository';
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
      // role entities
      ProjectRole,
      RoleQuestion,
      RoleQuestionOption,
      RoleEvaluation,
  // postulation answers
  PostulationAnswer,
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
