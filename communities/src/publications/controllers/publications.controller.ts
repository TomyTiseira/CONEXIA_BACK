import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreatePublicationDto } from '../dto/create-publication.dto';
import { UpdatePublicationDto } from '../dto/update-publication.dto';
import { PublicationsService } from '../services/publications.service';

@Controller()
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @MessagePattern('ping')
  ping() {
    return this.publicationsService.ping();
  }

  @MessagePattern('createPublication')
  createPublication(
    @Payload()
    data: {
      createPublicationDto: CreatePublicationDto;
      userId: number;
    },
  ) {
    return this.publicationsService.createPublication(
      data.createPublicationDto,
      data.userId,
    );
  }

  @MessagePattern('editPublication')
  editPublication(
    @Payload()
    data: {
      id: number;
      userId: number;
      updatePublicationDto: UpdatePublicationDto;
    },
  ) {
    return this.publicationsService.editPublication(
      data.id,
      data.userId,
      data.updatePublicationDto,
    );
  }

  @MessagePattern('getUserPublications')
  getUserPublications(@Payload() data: { userId: number }) {
    return this.publicationsService.getUserPublications(data.userId);
  }

  @MessagePattern('getPublications')
  getPublications(@Payload() data: { currentUserId: number }) {
    return this.publicationsService.getPublications(data.currentUserId);
  }

  @MessagePattern('deletePublication')
  async deletePublication(
    @Payload()
    data: {
      id: number;
      userId: number;
    },
  ) {
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
