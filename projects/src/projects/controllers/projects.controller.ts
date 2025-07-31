import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PublishProjectDto } from '../dtos/publish-project.dto';
import { ProjectsService } from '../services/projects.service';

@Controller()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @MessagePattern('ping')
  ping() {
    return this.projectsService.ping();
  }

  @MessagePattern('publishProject')
  async publishProject(@Payload() publishProjectDto: PublishProjectDto) {
    try {
      const result =
        await this.projectsService.publishProject(publishProjectDto);
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
