import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { envs, USERS_SERVICE } from 'src/config';
import { ProjectsController } from './controllers/projects.controller';
import { Category } from './entities/category.entity';
import { CollaborationType } from './entities/collaboration-type.entity';
import { ContractType } from './entities/contract-type.entity';
import { ProjectSkill } from './entities/project-skill.entity';
import { Project } from './entities/project.entity';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectsService } from './services/projects.service';
import { GetProjectByIdUseCase } from './services/use-cases/get-project-by-id.use-case';
import { GetProjectsByUserUseCase } from './services/use-cases/get-projects-by-user.use-case';
import { GetProjectsUseCase } from './services/use-cases/get-projects.use-case';
import { PingUseCase } from './services/use-cases/ping.use-case';
import { PublishProjectUseCase } from './services/use-cases/publish-project.use-case';
import { UsersClientService } from './services/users-client.service';

@Module({
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    UsersClientService,
    PublishProjectUseCase,
    GetProjectsUseCase,
    GetProjectByIdUseCase,
    GetProjectsByUserUseCase,
    PingUseCase,
    ProjectRepository,
  ],
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectSkill,
      Category,
      CollaborationType,
      ContractType,
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
  exports: [ProjectRepository],
})
export class ProjectsModule {}
