import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { ProjectsModule } from '../projects/projects.module';
import { SharedModule } from '../shared/shared.module';
import { PostulationsController } from './controllers/postulations.controller';
import { PostulationStatus } from './entities/postulation-status.entity';
import { Postulation } from './entities/postulation.entity';
import { PostulationAnswer } from './entities/postulation-answer.entity';
import { ProjectRole } from '../projects/entities/project-role.entity';
import { PostulationStatusRepository } from './repositories/postulation-status.repository';
import { PostulationRepository } from './repositories/postulation.repository';
import { PostulationOperationsService } from './services/postulation-operations.service';
import { PostulationSchedulerService } from './services/postulation-scheduler.service';
import { PostulationStatusService } from './services/postulation-status.service';
import { PostulationTransformService } from './services/postulation-transform.service';
import { PostulationValidationService } from './services/postulation-validation.service';
import { PostulationsService } from './services/postulations.service';
import { ApprovePostulationUseCase } from './services/use-cases/approve-postulation.use-case';
import { CancelPostulationUseCase } from './services/use-cases/cancel-postulation.use-case';
import { CreatePostulationUseCase } from './services/use-cases/create-postulation.use-case';
import { GetPostulationsByUserUseCase } from './services/use-cases/get-postulations-by-user.use-case';
import { GetPostulationsUseCase } from './services/use-cases/get-postulations.use-case';
import { RejectPostulationUseCase } from './services/use-cases/reject-postulation.use-case';
import { SubmitEvaluationUseCase } from './services/use-cases/submit-evaluation.use-case';

@Module({
  controllers: [PostulationsController],
  providers: [
    PostulationsService,
    CreatePostulationUseCase,
    GetPostulationsByUserUseCase,
    GetPostulationsUseCase,
    PostulationRepository,
    PostulationStatusRepository,
    ApprovePostulationUseCase,
    CancelPostulationUseCase,
    RejectPostulationUseCase,
    SubmitEvaluationUseCase,
    PostulationStatusService,
    PostulationValidationService,
    PostulationOperationsService,
    PostulationTransformService,
    PostulationSchedulerService,
  ],
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Postulation,
      PostulationStatus,
      PostulationAnswer,
      ProjectRole,
    ]),
    SharedModule,
    CommonModule,
    forwardRef(() => ProjectsModule),
  ],
  exports: [PostulationsService, PostulationRepository],
})
export class PostulationsModule {}
