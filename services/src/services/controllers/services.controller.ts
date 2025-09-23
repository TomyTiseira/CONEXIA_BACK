import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateServiceDto } from '../dto';
import { ServicesService } from '../services/services.service';

@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @MessagePattern('ping')
  async ping() {
    return {
      message: 'Services microservice is running',
      timestamp: new Date(),
    };
  }

  @MessagePattern('createService')
  async createService(
    @Payload() data: { createServiceDto: CreateServiceDto; userId: number },
  ) {
    return this.servicesService.createService(
      data.createServiceDto,
      data.userId,
    );
  }

  @MessagePattern('getServiceCategories')
  async getServiceCategories() {
    return this.servicesService.getCategories();
  }
}
