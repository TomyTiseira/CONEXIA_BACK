import { Injectable } from '@nestjs/common';
import { ApprovePostulationDto } from '../dtos/approve-postulation.dto';
import { CreatePostulationDto } from '../dtos/create-postulation.dto';
import { GetPostulationsDto } from '../dtos/get-postulations.dto';
import { ApprovePostulationUseCase } from './use-cases/approve-postulation.use-case';
import { CreatePostulationUseCase } from './use-cases/create-postulation.use-case';
import { GetPostulationsUseCase } from './use-cases/get-postulations.use-case';

@Injectable()
export class PostulationsService {
  constructor(
    private readonly createPostulationUseCase: CreatePostulationUseCase,
    private readonly approvePostulationUseCase: ApprovePostulationUseCase,
    private readonly getPostulationsUseCase: GetPostulationsUseCase,
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

  async approvePostulation(approvePostulationDto: ApprovePostulationDto) {
    return await this.approvePostulationUseCase.execute(approvePostulationDto);
  }

  async getPostulations(
    getPostulationsDto: GetPostulationsDto,
    currentUserId: number,
  ) {
    return await this.getPostulationsUseCase.execute(
      getPostulationsDto,
      currentUserId,
    );
  }
}
