import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreatePublicationDto,
  DeletePublicationDto,
  EditPublicationSimpleDto,
  GetPublicationByIdDto,
  GetPublicationsDto,
  GetUserPublicationsDto,
} from '../dto';
import { PublicationsService } from '../services/publications.service';

@Controller()
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @MessagePattern('ping')
  ping() {
    return this.publicationsService.ping();
  }

  @MessagePattern('createPublication')
  createPublication(@Payload() data: CreatePublicationDto) {
    return this.publicationsService.createPublication(data, data.userId);
  }

  @MessagePattern('editPublication')
  editPublication(@Payload() data: EditPublicationSimpleDto) {
    return this.publicationsService.editPublication(
      data.id,
      data.userId,
      data.updatePublicationDto,
    );
  }

  @MessagePattern('getUserPublications')
  getUserPublications(@Payload() data: GetUserPublicationsDto) {
    return this.publicationsService.getUserPublications(data);
  }

  @MessagePattern('getPublications')
  getPublications(@Payload() data: GetPublicationsDto) {
    return this.publicationsService.getPublications(data);
  }

  @MessagePattern('getPublicationById')
  getPublicationById(@Payload() data: GetPublicationByIdDto) {
    return this.publicationsService.getPublicationById(
      data.id,
      data.currentUserId,
    );
  }

  @MessagePattern('deletePublication')
  async deletePublication(@Payload() data: DeletePublicationDto) {
    try {
      await this.publicationsService.deletePublication(data.id, data.userId);
      return {
        id: data.id,
        message: 'Publication deleted successfully.',
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
