import { Injectable } from '@nestjs/common';
import { PublishProjectDto } from '../dtos/publish-project.dto';
import { PingUseCase } from './use-cases/ping.use-case';
import { PublishProjectUseCase } from './use-cases/publish-project.use-case';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly publishProjectUseCase: PublishProjectUseCase,
    private readonly pingUseCase: PingUseCase,
  ) {}

  ping() {
    return this.pingUseCase.execute();
  }

  async publishProject(projectData: PublishProjectDto) {
    return this.publishProjectUseCase.execute(projectData);
  }
}
