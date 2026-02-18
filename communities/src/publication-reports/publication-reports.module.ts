import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { PublicationsModule } from '../publications/publications.module';
import { PublicationReportsController } from './controllers/publication-reports.controller';
import { PublicationReport } from './entities/publication-report.entity';
import { PublicationReportRepository } from './repositories/publication-report.repository';
import { PublicationReportValidationService } from './services/publication-report-validation.service';
import { PublicationReportsService } from './services/publication-reports.service';
import { GetPublicationReportsUseCase } from './services/use-cases/get-publication-reports.use-case';
import { GetPublicationsWithReportsUseCase } from './services/use-cases/get-publications-with-reports.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([PublicationReport]),
    forwardRef(() => PublicationsModule),
    CommonModule,
  ],
  controllers: [PublicationReportsController],
  providers: [
    PublicationReportsService,
    PublicationReportRepository,
    PublicationReportValidationService,
    GetPublicationsWithReportsUseCase,
    GetPublicationReportsUseCase,
  ],
  exports: [PublicationReportsService, PublicationReportRepository],
})
export class PublicationReportsModule {}
