import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
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

@Module({
  imports: [TypeOrmModule.forFeature([Service, ServiceCategory]), CommonModule],
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
  ],
  exports: [ServicesService, ServiceRepository],
})
export class ServicesModule {}
