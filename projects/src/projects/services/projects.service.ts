import { Injectable } from '@nestjs/common';
import { DeleteProjectDto } from '../dtos/delete-project.dto';
import { GetProjectByIdDto } from '../dtos/get-project-by-id.dto';
import { GetProjectsByUserDto } from '../dtos/get-projects-by-user.dto';
import { GetProjectsDto } from '../dtos/get-projects.dto';
import { PublishProjectDto } from '../dtos/publish-project.dto';
import { ProjectRepository } from '../repositories/project.repository';
import { DeleteProjectUseCase } from './use-cases/delete-project.use-case';
import { GetProjectByIdUseCase } from './use-cases/get-project-by-id.use-case';
import { GetProjectsByUserUseCase } from './use-cases/get-projects-by-user.use-case';
import { GetProjectsUseCase } from './use-cases/get-projects.use-case';
import { PingUseCase } from './use-cases/ping.use-case';
import { PublishProjectUseCase } from './use-cases/publish-project.use-case';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly publishProjectUseCase: PublishProjectUseCase,
    private readonly getProjectsUseCase: GetProjectsUseCase,
    private readonly getProjectByIdUseCase: GetProjectByIdUseCase,
    private readonly getProjectsByUserUseCase: GetProjectsByUserUseCase,
    private readonly deleteProjectUseCase: DeleteProjectUseCase,
    private readonly pingUseCase: PingUseCase,
    private readonly projectRepository: ProjectRepository,
  ) {}

  ping() {
    return this.pingUseCase.execute();
  }

  async publishProject(projectData: PublishProjectDto) {
    return this.publishProjectUseCase.execute(projectData);
  }

  async getProjects(getProjectsDto: GetProjectsDto, currentUserId: number) {
    return this.getProjectsUseCase.execute(getProjectsDto, currentUserId);
  }

  async deleteProject(deleteProjectDto: DeleteProjectDto) {
    return this.deleteProjectUseCase.execute(
      deleteProjectDto.projectId,
      deleteProjectDto.reason,
      deleteProjectDto.userId,
    );
  }

  async getCategories() {
    return this.projectRepository.findAllCategories();
  }

  async getCollaborationTypes() {
    return this.projectRepository.findAllCollaborationTypes();
  }

  async getContractTypes() {
    return this.projectRepository.findAllContractTypes();
  }

  async getProjectById(data: GetProjectByIdDto) {
    return this.getProjectByIdUseCase.execute(data);
  }

  async getProjectsByUser(data: GetProjectsByUserDto) {
    return this.getProjectsByUserUseCase.execute(data);
  }
}
