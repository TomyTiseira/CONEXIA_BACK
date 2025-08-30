import { Injectable } from '@nestjs/common';
import { CreatePublicationDto } from '../dto/create-publication.dto';
import { UpdatePublicationDto } from '../dto/update-publication.dto';
import {
  CreatePublicationUseCase,
  DeletePublicationUseCase,
  EditPublicationUseCase,
  GetPublicationByIdUseCase,
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
    private readonly getPublicationByIdUseCase: GetPublicationByIdUseCase,
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

  async editPublication(
    id: number,
    userId: number,
    updateDto: Partial<UpdatePublicationDto>,
  ) {
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

  async getPublicationById(id: number, currentUserId?: number) {
    return await this.getPublicationByIdUseCase.execute(id, currentUserId);
  }
}
