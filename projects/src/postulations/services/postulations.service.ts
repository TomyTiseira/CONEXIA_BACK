import { Injectable } from '@nestjs/common';
import { CreatePostulationDto } from '../dtos/create-postulation.dto';
import { PostulationRepository } from '../repositories/postulation.repository';
import { CreatePostulationUseCase } from './use-cases/create-postulation.use-case';

@Injectable()
export class PostulationsService {
  constructor(
    private readonly createPostulationUseCase: CreatePostulationUseCase,
    private readonly postulationRepository: PostulationRepository,
  ) {}

  async createPostulation(
    createPostulationDto: CreatePostulationDto,
    currentUserId: number,
  ) {
    return await this.createPostulationUseCase.execute(
      createPostulationDto,
      currentUserId,
    );
  }
}
