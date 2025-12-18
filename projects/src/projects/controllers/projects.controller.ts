import { Controller } from '@nestjs/common';
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
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly skillsService: SkillsService,
  ) {}

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

  @MessagePattern('getSkillsByRubro')
  async getSkillsByRubro(@Payload() data: { rubroId: number }) {
    return await this.skillsService.getSkillsByRubro(data.rubroId);
  }

  @MessagePattern('getRubros')
  async getRubros() {
    return await this.skillsService.getRubros();
  }

  @MessagePattern('getUserProjectMetrics')
  async getUserProjectMetrics(@Payload() data: { userId: number }) {
    try {
      return await this.projectsService.getUserProjectMetrics(data.userId);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('getUserPostulationMetrics')
  async getUserPostulationMetrics(@Payload() data: { userId: number }) {
    try {
      return await this.projectsService.getUserPostulationMetrics(data.userId);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('getAdminProjectMetrics')
  async getAdminProjectMetrics() {
    try {
      return await this.projectsService.getAdminProjectMetrics();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('getProjectDashboardMetrics')
  async getProjectDashboardMetrics(
    @Payload()
    data: {
      userId: number;
      userPlan: { name: string; isFreePlan: boolean };
    },
  ) {
    try {
      return await this.projectsService.getProjectDashboardMetrics(
        data.userId,
        data.userPlan,
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
