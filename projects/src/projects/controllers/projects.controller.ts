import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { DeleteProjectDto } from '../dtos/delete-project.dto';
import { GetProjectByIdDto } from '../dtos/get-project-by-id.dto';
import { GetProjectsByUserDto } from '../dtos/get-projects-by-user.dto';
import { GetProjectsDto } from '../dtos/get-projects.dto';
import { PublishProjectDto } from '../dtos/publish-project.dto';
import { ProjectsService } from '../services/projects.service';
import { SkillsService } from '../services/skills.service';

@Controller()
export class ProjectsController {
  private readonly logger: Logger;
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly skillsService: SkillsService,
  ) {
    this.logger = new Logger(ProjectsController.name);
  }

  @MessagePattern('ping')
  ping() {
    this.logger.log(`[${new Date().toISOString()}] ping recibido`);
    return this.projectsService.ping();
  }

  @MessagePattern('publishProject')
  async publishProject(@Payload() publishProjectDto: PublishProjectDto) {
    this.logger.log(
      `[${new Date().toISOString()}] publishProject recibido: ${JSON.stringify(publishProjectDto)}`,
    );
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
    this.logger.log(
      `[${new Date().toISOString()}] getProjects recibido: ${JSON.stringify(data)}`,
    );
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
    this.logger.log(`[${new Date().toISOString()}] getCategories recibido`);
    return await this.projectsService.getCategories();
  }

  @MessagePattern('getCollaborationTypes')
  async getCollaborationTypes() {
    this.logger.log(
      `[${new Date().toISOString()}] getCollaborationTypes recibido`,
    );
    return await this.projectsService.getCollaborationTypes();
  }

  @MessagePattern('getContractTypes')
  async getContractTypes() {
    this.logger.log(`[${new Date().toISOString()}] getContractTypes recibido`);
    return await this.projectsService.getContractTypes();
  }

  @MessagePattern('getProjectById')
  async getProjectById(@Payload() data: GetProjectByIdDto) {
    this.logger.log(
      `[${new Date().toISOString()}] getProjectById recibido: ${JSON.stringify(data)}`,
    );
    return await this.projectsService.getProjectById(data);
  }

  @MessagePattern('getProjectsByUser')
  async getProjectsByUser(@Payload() data: GetProjectsByUserDto) {
    this.logger.log(
      `[${new Date().toISOString()}] getProjectsByUser recibido: ${JSON.stringify(data)}`,
    );
    return await this.projectsService.getProjectsByUser(data);
  }

  @MessagePattern('deleteProject')
  async deleteProject(@Payload() deleteProjectDto: DeleteProjectDto) {
    this.logger.log(
      `[${new Date().toISOString()}] deleteProject recibido: ${JSON.stringify(deleteProjectDto)}`,
    );
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

  @MessagePattern('getSkillsByRubro')
  async getSkillsByRubro(@Payload() data: { rubroId: number }) {
    this.logger.log(
      `[${new Date().toISOString()}] getSkillsByRubro recibido: ${JSON.stringify(data)}`,
    );
    return await this.skillsService.getSkillsByRubro(data.rubroId);
  }

  @MessagePattern('getRubros')
  async getRubros() {
    this.logger.log(`[${new Date().toISOString()}] getRubros recibido`);
    return await this.skillsService.getRubros();
  }
}
