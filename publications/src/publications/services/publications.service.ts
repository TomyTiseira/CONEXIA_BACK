import { Injectable } from '@nestjs/common';
import {
  CreatePublicationUseCase,
  GetPublicationByIdUseCase,
  GetPublicationsUseCase,
} from './use-cases';

@Injectable()
export class PublicationsService {
  constructor(
    private readonly createPublicationUseCase: CreatePublicationUseCase,
    private readonly getPublicationsUseCase: GetPublicationsUseCase,
    private readonly getPublicationByIdUseCase: GetPublicationByIdUseCase,
  ) {}

  ping() {
    return {
      message: 'Publications microservice is running!',
      timestamp: new Date().toISOString(),
    };
  }

  async createPublication(
    description: string,
    imageData?: { filename: string; size: number },
  ) {
    return await this.createPublicationUseCase.execute({
      description,
      imageFilename: imageData?.filename,
      imageSize: imageData?.size,
    });
  }

  async getPublications() {
    return await this.getPublicationsUseCase.execute();
  }

  async getPublicationById(id: number) {
    return await this.getPublicationByIdUseCase.execute(id);
  }
}
