import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostulationsModule } from '../postulations/postulations.module';
import { ReportsModule } from '../reports/reports.module';
import { SharedModule } from '../shared/shared.module';
import { ProjectsController } from './controllers/projects.controller';
import { Category } from './entities/category.entity';
import { CollaborationType } from './entities/collaboration-type.entity';
import { ContractType } from './entities/contract-type.entity';
import { ProjectsService } from './services/projects.service';
import { SkillsService } from './services/skills.service';
import { DeleteProjectUseCase } from './services/use-cases/delete-project.use-case';
import { GetProjectByIdUseCase } from './services/use-cases/get-project-by-id.use-case';
import { GetProjectsByUserUseCase } from './services/use-cases/get-projects-by-user.use-case';
import { GetProjectsUseCase } from './services/use-cases/get-projects.use-case';
import { PingUseCase } from './services/use-cases/ping.use-case';
import { PublishProjectUseCase } from './services/use-cases/publish-project.use-case';

@Module({
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    PublishProjectUseCase,
    GetProjectsUseCase,
    GetProjectByIdUseCase,
    GetProjectsByUserUseCase,
    DeleteProjectUseCase,
    PingUseCase,
    SkillsService,
  ],
  imports: [
    TypeOrmModule.forFeature([Category, CollaborationType, ContractType]),
    forwardRef(() => PostulationsModule),
    ReportsModule,
    SharedModule,
  ],
  exports: [ProjectsService, SkillsService],
})
export class ProjectsModule {}
