import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { RpcExceptionInterceptor } from './common/interceptors/rpc-exception.interceptor';
import { envs, USERS_SERVICE } from './config';
import { PostulationStatus } from './postulations/entities/postulation-status.entity';
import { Postulation } from './postulations/entities/postulation.entity';
import { Category } from './projects/entities/category.entity';
import { CollaborationType } from './projects/entities/collaboration-type.entity';
import { ContractType } from './projects/entities/contract-type.entity';
import { ProjectSkill } from './projects/entities/project-skill.entity';
import { Project } from './projects/entities/project.entity';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.dbHost,
      port: parseInt(envs.dbPort),
      username: envs.dbUsername,
      password: envs.dbPassword,
      database: envs.dbDatabase,
      entities: [
        Project,
        ProjectSkill,
        Category,
        CollaborationType,
        ContractType,
        Postulation,
        PostulationStatus,
      ],
      synchronize: true,
    }),
    ClientsModule.register([
      {
        name: USERS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
    CommonModule,
    ProjectsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RpcExceptionInterceptor,
    },
  ],
})
export class AppModule {}
