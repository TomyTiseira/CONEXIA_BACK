import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { ModerationController } from './common/controllers/moderation.controller';
import { RpcExceptionInterceptor } from './common/interceptors/rpc-exception.interceptor';
import { ModerationListenerService } from './common/services/moderation-listener.service';
import { envs } from './config';
import { SeedService } from './seed/seed.service';
import { PostulationAnswer } from './postulations/entities/postulation-answer.entity';
import { PostulationStatus } from './postulations/entities/postulation-status.entity';
import { Postulation } from './postulations/entities/postulation.entity';
import { PostulationsModule } from './postulations/postulations.module';
import { Category } from './projects/entities/category.entity';
import { CollaborationType } from './projects/entities/collaboration-type.entity';
import { ContractType } from './projects/entities/contract-type.entity';
import { ProjectRole } from './projects/entities/project-role.entity';
import { ProjectSkill } from './projects/entities/project-skill.entity';
import { Project } from './projects/entities/project.entity';
import { RoleEvaluation } from './projects/entities/role-evaluation.entity';
import { RoleQuestionOption } from './projects/entities/role-question-option.entity';
import { RoleQuestion } from './projects/entities/role-question.entity';
import { RoleSkill } from './projects/entities/role-skill.entity';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports';
import { Report } from './reports/entities/report.entity';
import { SeedService } from './seed/seed.service';
import { Rubro } from './shared/entities/rubro.entity';
import { Skill } from './shared/entities/skill.entity';

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
        RoleSkill,
        ProjectSkill,
        Category,
        CollaborationType,
        ContractType,
        Postulation,
        PostulationAnswer,
        // role entities
        ProjectRole,
        RoleQuestion,
        RoleQuestionOption,
        RoleEvaluation,
        PostulationStatus,
        Report,
        Rubro,
        Skill,
      ],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Project, Postulation, PostulationStatus]),
    CommonModule,
    PostulationsModule,
    ReportsModule,
    ProjectsModule,
  ],
  controllers: [ModerationController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: RpcExceptionInterceptor,
    },
    ModerationListenerService,
    SeedService,
  ],
})
export class AppModule {}
