import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../projects/entities/project.entity';
import { SharedModule } from '../shared/shared.module';
import { ReportsController } from './controllers/reports.controller';
import { Report } from './entities/report.entity';
import { ReportRepository } from './repositories/report.repository';
import { ReportValidationService } from './services/report-validation.service';
import { ReportsService } from './services/reports.service';
import { GetProjectReportsUseCase } from './services/use-cases/get-project-reports.use-case';
import { GetProjectsWithReportsUseCase } from './services/use-cases/get-projects-with-reports.use-case';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportValidationService,
    ReportRepository,
    GetProjectsWithReportsUseCase,
    GetProjectReportsUseCase,
  ],
  imports: [TypeOrmModule.forFeature([Report, Project]), SharedModule],
  exports: [ReportsService, ReportRepository],
})
export class ReportsModule {}
