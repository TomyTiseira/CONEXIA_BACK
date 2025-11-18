import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostulationsModule } from '../postulations/postulations.module';
import { ReportsModule } from '../reports/reports.module';
import { SharedModule } from '../shared/shared.module';
import { ProjectsController } from './controllers/projects.controller';
import { Category } from './entities/category.entity';
import { CollaborationType } from './entities/collaboration-type.entity';
import { ContractType } from './entities/contract-type.entity';
import { Project } from './entities/project.entity';
import { ProjectRole } from './entities/project-role.entity';
import { ProjectSkill } from './entities/project-skill.entity';
import { RoleSkill } from './entities/role-skill.entity';
import { RoleQuestion } from './entities/role-question.entity';
import { RoleQuestionOption } from './entities/role-question-option.entity';
import { RoleEvaluation } from './entities/role-evaluation.entity';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectsService } from './services/projects.service';
import { SkillsService } from './services/skills.service';
import { DeleteProjectUseCase } from './services/use-cases/delete-project.use-case';
import { GetProjectByIdUseCase } from './services/use-cases/get-project-by-id.use-case';
import { GetProjectsByUserUseCase } from './services/use-cases/get-projects-by-user.use-case';
import { GetProjectsUseCase } from './services/use-cases/get-projects.use-case';
import { GetAdminProjectMetricsUseCase } from './services/use-cases/metrics/get-admin-project-metrics.use-case';
import { GetUserPostulationMetricsUseCase } from './services/use-cases/metrics/get-user-postulation-metrics.use-case';
import { GetUserProjectMetricsUseCase } from './services/use-cases/metrics/get-user-project-metrics.use-case';
import { PingUseCase } from './services/use-cases/ping.use-case';
import { PublishProjectUseCase } from './services/use-cases/publish-project.use-case';

@Module({
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectRepository,
    PublishProjectUseCase,
    GetProjectsUseCase,
    GetProjectByIdUseCase,
    GetProjectsByUserUseCase,
    DeleteProjectUseCase,
    PingUseCase,
    SkillsService,
    GetUserProjectMetricsUseCase,
    GetUserPostulationMetricsUseCase,
    GetAdminProjectMetricsUseCase,
  ],
  imports: [
    TypeOrmModule.forFeature([
      Project,
      Category,
      CollaborationType,
      ContractType,
      ProjectSkill,
      RoleSkill,
      ProjectRole,
      RoleQuestion,
      RoleQuestionOption,
      RoleEvaluation,
    ]),
    SharedModule,
    forwardRef(() => PostulationsModule),
    forwardRef(() => ReportsModule),
  ],
  exports: [ProjectsService, SkillsService, ProjectRepository],
})
export class ProjectsModule {}
