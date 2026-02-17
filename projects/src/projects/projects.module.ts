import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../common/storage.module';
import { PostulationStatus } from '../postulations/entities/postulation-status.entity';
import { Postulation } from '../postulations/entities/postulation.entity';
import { PostulationsModule } from '../postulations/postulations.module';
import { ReportsModule } from '../reports/reports.module';
import { SharedModule } from '../shared/shared.module';
import { ProjectsController } from './controllers/projects.controller';
import { Category } from './entities/category.entity';
import { CollaborationType } from './entities/collaboration-type.entity';
import { ContractType } from './entities/contract-type.entity';
import { ProjectRole } from './entities/project-role.entity';
import { ProjectSkill } from './entities/project-skill.entity';
import { Project } from './entities/project.entity';
import { RoleEvaluation } from './entities/role-evaluation.entity';
import { RoleQuestionOption } from './entities/role-question-option.entity';
import { RoleQuestion } from './entities/role-question.entity';
import { RoleSkill } from './entities/role-skill.entity';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectsService } from './services/projects.service';
import { SkillsService } from './services/skills.service';
import { DeleteProjectUseCase } from './services/use-cases/delete-project.use-case';
import { GetProjectByIdUseCase } from './services/use-cases/get-project-by-id.use-case';
import { GetProjectsByUserUseCase } from './services/use-cases/get-projects-by-user.use-case';
import { GetProjectsUseCase } from './services/use-cases/get-projects.use-case';
import { GetAdminProjectMetricsUseCase } from './services/use-cases/metrics/get-admin-project-metrics.use-case';
import { GetProjectDashboardMetricsUseCase } from './services/use-cases/metrics/get-project-dashboard-metrics.use-case';
import { GetProjectsWithPostulationsPercentageUseCase } from './services/use-cases/metrics/get-projects-with-postulations-percentage.use-case';
import { GetReceivedPostulationsMetricsUseCase } from './services/use-cases/metrics/get-received-postulations-metrics.use-case';
import { GetSentPostulationsMetricsUseCase } from './services/use-cases/metrics/get-sent-postulations-metrics.use-case';
import { GetTopProjectsByPostulationsUseCase } from './services/use-cases/metrics/get-top-projects-by-postulations.use-case';
import { GetUserPostulationMetricsUseCase } from './services/use-cases/metrics/get-user-postulation-metrics.use-case';
import { GetUserProjectMetricsUseCase } from './services/use-cases/metrics/get-user-project-metrics.use-case';
import { PingUseCase } from './services/use-cases/ping.use-case';
import { PublishProjectUseCase } from './services/use-cases/publish-project.use-case';
import { GetProjectPostulationsStatsUseCase } from './services/use-cases/stats/get-project-postulations-stats.use-case';

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
    GetReceivedPostulationsMetricsUseCase,
    GetSentPostulationsMetricsUseCase,
    GetProjectsWithPostulationsPercentageUseCase,
    GetTopProjectsByPostulationsUseCase,
    GetProjectDashboardMetricsUseCase,
    GetProjectPostulationsStatsUseCase,
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
      Postulation,
      PostulationStatus,
    ]),
    SharedModule,
    StorageModule,
    forwardRef(() => PostulationsModule),
    forwardRef(() => ReportsModule),
  ],
  exports: [ProjectsService, SkillsService, ProjectRepository],
})
export class ProjectsModule {}
