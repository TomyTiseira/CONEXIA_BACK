import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs, USERS_SERVICE } from 'src/config';
import { UsersClientService } from '../common/services/users-client.service';
import { PostulationStatus } from '../postulations/entities/postulation-status.entity';
import { Postulation } from '../postulations/entities/postulation.entity';
import { ProjectSkill } from '../projects/entities/project-skill.entity';
import { Project } from '../projects/entities/project.entity';
import { ProjectRepository } from '../projects/repositories/project.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Project,
      ProjectSkill,
      Postulation,
      PostulationStatus,
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
  providers: [ProjectRepository, UsersClientService],
  exports: [ProjectRepository, UsersClientService],
})
export class SharedModule {}
