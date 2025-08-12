import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreatePostulationDto } from '../dtos/create-postulation.dto';
import { PostulationsService } from '../services/postulations.service';

@Controller()
export class PostulationsController {
  constructor(private readonly postulationsService: PostulationsService) {}

  @MessagePattern('createPostulation')
  async createPostulation(
    @Payload()
    data: {
      createPostulationDto: CreatePostulationDto;
      currentUserId: number;
    },
  ) {
    const result = await this.postulationsService.createPostulation(
      data.createPostulationDto,
      data.currentUserId,
    );
    return result;
  }

  @MessagePattern('approvePostulation')
  async approvePostulation(
    @Payload() data: { postulationId: number; currentUserId: number },
  ) {
    return await this.postulationsService.approvePostulation(data);
  }
}
