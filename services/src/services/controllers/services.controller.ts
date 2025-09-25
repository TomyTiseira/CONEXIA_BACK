import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateServiceDto,
  DeleteServiceDto,
  GetServiceByIdDto,
  GetServicesByUserDto,
  GetServicesDto,
  UpdateServiceDataDto,
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

  @MessagePattern('updateService')
  async updateService(@Payload() updateServiceDataDto: UpdateServiceDataDto) {
    try {
      const result =
        await this.servicesService.updateService(updateServiceDataDto);
      return {
        id: result.id,
        title: result.title,
        price: result.price,
        estimatedHours: result.estimatedHours,
        message: 'Service updated successfully.',
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('deleteService')
  async deleteService(@Payload() deleteServiceDto: DeleteServiceDto) {
    try {
      const result = await this.servicesService.deleteService(deleteServiceDto);
      return {
        id: result.id,
        title: result.title,
        message: 'Service deleted successfully.',
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('getServiceCategories')
  async getServiceCategories() {
    return this.servicesService.getCategories();
  }
}
