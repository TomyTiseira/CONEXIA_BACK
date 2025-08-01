import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DeleteProjectDto } from '../dtos/delete-project.dto';
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

  @MessagePattern('getCategories')
  async getCategories() {
    return await this.projectsService.getCategories();
  }

  @MessagePattern('getCollaborationTypes')
  async getCollaborationTypes() {
    return await this.projectsService.getCollaborationTypes();
  }

  @MessagePattern('getContractTypes')
  async getContractTypes() {
    return await this.projectsService.getContractTypes();
  }

  @MessagePattern('deleteProject')
  async deleteProject(@Payload() deleteProjectDto: DeleteProjectDto) {
    try {
      const result = await this.projectsService.deleteProject(deleteProjectDto);
      return {
        id: result.id,
        title: result.title,
        message: 'Project deleted successfully.',
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
