import { Injectable } from '@nestjs/common';
import { CreatePublicationDto } from '../dto/create-publication.dto';
import { CreatePublicationUseCase } from './use-cases';

@Injectable()
export class PublicationsService {
  constructor(
    private readonly createPublicationUseCase: CreatePublicationUseCase,
  ) {}

  ping() {
    return {
      message: 'Publications microservice is running!',
      timestamp: new Date().toISOString(),
    };
  }

  async createPublication(data: CreatePublicationDto, userId: number) {
    return await this.createPublicationUseCase.execute(data, userId);
  }
}
