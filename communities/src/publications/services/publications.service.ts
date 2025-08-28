import { Injectable } from '@nestjs/common';
import { CreatePublicationDto } from '../dto/create-publication.dto';
import {
  CreatePublicationUseCase,
  DeletePublicationUseCase,
  EditPublicationUseCase,
  GetPublicationsUseCase,
  GetUserPublicationsUseCase,
} from './use-cases';

@Injectable()
export class PublicationsService {
  constructor(
    private readonly createPublicationUseCase: CreatePublicationUseCase,
    private readonly editPublicationUseCase: EditPublicationUseCase,
    private readonly deletePublicationUseCase: DeletePublicationUseCase,
    private readonly getPublicationsUseCase: GetPublicationsUseCase,
    private readonly getUserPublicationsUseCase: GetUserPublicationsUseCase,
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

  async editPublication(id: number, userId: number, updateDto: any) {
    return await this.editPublicationUseCase.execute(id, userId, updateDto);
  }

  async deletePublication(id: number, userId: number) {
    return await this.deletePublicationUseCase.execute(id, userId);
  }

  async getPublications(currentUserId: number) {
    return await this.getPublicationsUseCase.execute(currentUserId);
  }

  async getUserPublications(userId: number) {
    return await this.getUserPublicationsUseCase.execute(userId);
  }
}
