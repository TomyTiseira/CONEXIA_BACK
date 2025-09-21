import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './controllers';
import { Service } from './entities';
import { ServiceRepository } from './repositories';
import { ServicesService } from './services';
import { CreateServiceUseCase } from './services/use-cases';

@Module({
  imports: [TypeOrmModule.forFeature([Service])],
  controllers: [ServicesController],
  providers: [ServiceRepository, ServicesService, CreateServiceUseCase],
  exports: [ServicesService],
})
export class ServicesModule {}
