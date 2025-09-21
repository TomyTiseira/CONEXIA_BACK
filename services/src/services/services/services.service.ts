import { Injectable } from '@nestjs/common';
import { CreateServiceDto } from '../dto';
import { CreateServiceUseCase } from './use-cases/create-service.use-case';

@Injectable()
export class ServicesService {
  constructor(private readonly createServiceUseCase: CreateServiceUseCase) {}

  async createService(createServiceDto: CreateServiceDto, userId: number) {
    return this.createServiceUseCase.execute(createServiceDto, userId);
  }
}
