import { Injectable } from '@nestjs/common';
import { GetProjectsDto } from '../dtos/get-projects.dto';
import { PublishProjectDto } from '../dtos/publish-project.dto';
import { ProjectRepository } from '../repositories/project.repository';
import { GetProjectsUseCase } from './use-cases/get-projects.use-case';
import { PingUseCase } from './use-cases/ping.use-case';
import { PublishProjectUseCase } from './use-cases/publish-project.use-case';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly publishProjectUseCase: PublishProjectUseCase,
    private readonly getProjectsUseCase: GetProjectsUseCase,
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

  async getCategories() {
    return this.projectRepository.findAllCategories();
  }

  async getCollaborationTypes() {
    return this.projectRepository.findAllCollaborationTypes();
  }

  async getContractTypes() {
    return this.projectRepository.findAllContractTypes();
  }
}
