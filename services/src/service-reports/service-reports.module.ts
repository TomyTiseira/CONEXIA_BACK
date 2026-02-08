import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { ServicesModule } from '../services/services.module';
import { ServiceReportsController } from './controllers/service-reports.controller';
import { ServiceReport } from './entities/service-report.entity';
import { ServiceReportRepository } from './repositories/service-report.repository';
import { ServiceReportValidationService } from './services/service-report-validation.service';
import { ServiceReportsService } from './services/service-reports.service';
import { GetServiceReportsUseCase } from './services/use-cases/get-service-reports.use-case';
import { GetServicesWithReportsUseCase } from './services/use-cases/get-services-with-reports.use-case';

@Module({
  controllers: [ServiceReportsController],
  providers: [
    ServiceReportsService,
    ServiceReportValidationService,
    ServiceReportRepository,
    GetServicesWithReportsUseCase,
    GetServiceReportsUseCase,
  ],
  imports: [
    TypeOrmModule.forFeature([ServiceReport]),
    CommonModule,
    forwardRef(() => ServicesModule),
  ],
  exports: [ServiceReportsService, ServiceReportRepository],
})
export class ServiceReportsModule {}
