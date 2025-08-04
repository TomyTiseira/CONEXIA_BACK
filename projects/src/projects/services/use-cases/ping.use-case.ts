import { Injectable } from '@nestjs/common';
import { ProjectRepository } from '../../repositories/project.repository';

@Injectable()
export class PingUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  execute(): string {
    return this.projectRepository.ping();
  }
}
