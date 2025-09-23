import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './controllers';
import { Service, ServiceCategory } from './entities';
import { ServiceRepository } from './repositories';
import { CategoryService, ServicesService } from './services';
import { CreateServiceUseCase } from './services/use-cases';

@Module({
  imports: [TypeOrmModule.forFeature([Service, ServiceCategory])],
  controllers: [ServicesController],
  providers: [
    ServiceRepository,
    ServicesService,
    CategoryService,
    CreateServiceUseCase,
  ],
  exports: [ServicesService],
})
export class ServicesModule {}
