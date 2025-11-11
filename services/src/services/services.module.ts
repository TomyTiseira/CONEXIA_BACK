import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { ServiceHiringsModule } from '../service-hirings/service-hirings.module';
import { ServiceReportsModule } from '../service-reports/service-reports.module';
import { ServiceReviewsModule } from '../service-reviews/service-reviews.module';
import { ServicesController } from './controllers';
import { Service, ServiceCategory } from './entities';
import { ServiceRepository } from './repositories';
import { CategoryService, ServicesService } from './services';
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
    TypeOrmModule.forFeature([Service, ServiceCategory]),
    CommonModule,
    forwardRef(() => ServiceHiringsModule),
    forwardRef(() => ServiceReviewsModule),
    forwardRef(() => ServiceReportsModule),
  ],
  controllers: [ServicesController],
  providers: [
    ServiceRepository,
    ServicesService,
    CategoryService,
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
  exports: [ServicesService, ServiceRepository],
})
export class ServicesModule {}
