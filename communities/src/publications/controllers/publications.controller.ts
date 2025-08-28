import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreatePublicationDto } from '../dto/create-publication.dto';
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
}
