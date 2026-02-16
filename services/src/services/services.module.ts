import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { StorageModule } from '../common/storage.module';
import { Claim } from '../service-hirings/entities/claim.entity';
import { ServiceHiring } from '../service-hirings/entities/service-hiring.entity';
import { ServiceHiringsModule } from '../service-hirings/service-hirings.module';
import { ServiceReportsModule } from '../service-reports/service-reports.module';
import { ServiceReview } from '../service-reviews/entities/service-review.entity';
import { ServiceReviewsModule } from '../service-reviews/service-reviews.module';
import { ServicesController } from './controllers';
import { Service, ServiceCategory } from './entities';
import { ServiceRepository } from './repositories';
import { CategoryService, ServicesService } from './services';
import { ServiceMetricsService } from './services/service-metrics.service';
import {
  CreateServiceUseCase,
  DeleteServiceUseCase,
  UpdateServiceUseCase,
} from './services/use-cases';
import { GetServiceByIdUseCase } from './services/use-cases/get-service-by-id.use-case';
import { GetServicesByUserUseCase } from './services/use-cases/get-services-by-user.use-case';
import { GetServicesUseCase } from './services/use-cases/get-services.use-case';
import { GetAdminServiceMetricsUseCase } from './services/use-cases/metrics/get-admin-service-metrics.use-case';
import { GetUserServiceMetricsUseCase } from './services/use-cases/metrics/get-user-service-metrics.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Service,
      ServiceCategory,
      ServiceHiring,
      ServiceReview,
      Claim,
    ]),
    CommonModule,
    StorageModule,
    forwardRef(() => ServiceHiringsModule),
    forwardRef(() => ServiceReviewsModule),
    forwardRef(() => ServiceReportsModule),
  ],
  controllers: [ServicesController],
  providers: [
    ServiceRepository,
    ServicesService,
    CategoryService,
    ServiceMetricsService,
    CreateServiceUseCase,
    UpdateServiceUseCase,
    DeleteServiceUseCase,
    GetServicesUseCase,
    GetServicesByUserUseCase,
    GetServiceByIdUseCase,
    UpdateServiceUseCase,
    GetUserServiceMetricsUseCase,
    GetAdminServiceMetricsUseCase,
  ],
  exports: [ServicesService, ServiceRepository, ServiceMetricsService],
})
export class ServicesModule {}
