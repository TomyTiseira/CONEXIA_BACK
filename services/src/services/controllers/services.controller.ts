import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateServiceDto,
  GetServiceByIdDto,
  GetServicesByUserDto,
  GetServicesDto,
} from '../dto';
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

  @MessagePattern('getServices')
  async getServices(
    @Payload() data: { getServicesDto: GetServicesDto; currentUserId: number },
  ) {
    try {
      const result = await this.servicesService.getServices(
        data.getServicesDto,
        data.currentUserId,
      );
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('getServicesByUser')
  async getServicesByUser(@Payload() data: GetServicesByUserDto) {
    try {
      const result = await this.servicesService.getServicesByUser(data);
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('getServiceById')
  async getServiceById(@Payload() data: GetServiceByIdDto) {
    try {
      const result = await this.servicesService.getServiceById(data);
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('getServiceCategories')
  async getServiceCategories() {
    return this.servicesService.getCategories();
  }

  @MessagePattern('deleteService')
  async deleteService(
    @Payload()
    data: {
      serviceId: number;
      reason: string;
      userId: number;
    },
  ) {
    try {
      const result = await this.servicesService.deleteService(
        data.serviceId,
        data.reason,
        data.userId,
      );
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('updateService')
  async updateService(
    @Payload()
    data: {
      serviceId: number;
      userId: number;
      price?: number;
      estimatedHours?: number | null;
      timeUnit?: string;
    },
  ) {
    try {
      const result = await this.servicesService.updateService(
        data.serviceId,
        data.userId,
        {
          price: data.price,
          estimatedHours: data.estimatedHours,
          timeUnit: data.timeUnit as any,
        },
      );
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
