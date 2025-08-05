import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GetProjectByIdDto } from '../dtos/get-project-by-id.dto';
import { GetProjectsByUserDto } from '../dtos/get-projects-by-user.dto';
import { GetProjectsDto } from '../dtos/get-projects.dto';
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

  @MessagePattern('getProjects')
  async getProjects(
    @Payload() data: { getProjectsDto: GetProjectsDto; currentUserId: number },
  ) {
    try {
      const result = await this.projectsService.getProjects(
        data.getProjectsDto,
        data.currentUserId,
      );
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

  @MessagePattern('getProjectById')
  async getProjectById(@Payload() data: GetProjectByIdDto) {
    return await this.projectsService.getProjectById(data);
  }

  @MessagePattern('getProjectsByUser')
  async getProjectsByUser(@Payload() data: GetProjectsByUserDto) {
    return await this.projectsService.getProjectsByUser(data);
  }
}
