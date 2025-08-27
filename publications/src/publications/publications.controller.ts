import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { PublicationsService } from './publications.service';

@Controller()
export class PublicationsController {
  constructor(private readonly publicationsService: PublicationsService) {}

  @MessagePattern('ping')
  ping() {
    return this.publicationsService.ping();
  }
}
