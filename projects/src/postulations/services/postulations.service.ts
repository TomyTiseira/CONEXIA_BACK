import { Injectable } from '@nestjs/common';
import { ApprovePostulationDto } from '../dtos/approve-postulation.dto';
import { CancelPostulationDto } from '../dtos/cancel-postulation.dto';
import { CreatePostulationDto } from '../dtos/create-postulation.dto';
import { GetPostulationsByUserDto } from '../dtos/get-postulations-by-user.dto';
import { GetPostulationsDto } from '../dtos/get-postulations.dto';
import { RejectPostulationDto } from '../dtos/reject-postulation.dto';
import { ApprovePostulationUseCase } from './use-cases/approve-postulation.use-case';
import { CancelPostulationUseCase } from './use-cases/cancel-postulation.use-case';
import { CreatePostulationUseCase } from './use-cases/create-postulation.use-case';
import { GetPostulationsByUserUseCase } from './use-cases/get-postulations-by-user.use-case';
import { GetPostulationsUseCase } from './use-cases/get-postulations.use-case';
import { RejectPostulationUseCase } from './use-cases/reject-postulation.use-case';

@Injectable()
export class PostulationsService {
  constructor(
    private readonly createPostulationUseCase: CreatePostulationUseCase,
    private readonly approvePostulationUseCase: ApprovePostulationUseCase,
    private readonly cancelPostulationUseCase: CancelPostulationUseCase,
    private readonly rejectPostulationUseCase: RejectPostulationUseCase,
    private readonly getPostulationsByUserUseCase: GetPostulationsByUserUseCase,
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

  async cancelPostulation(cancelPostulationDto: CancelPostulationDto) {
    return await this.cancelPostulationUseCase.execute(cancelPostulationDto);
  }

  async rejectPostulation(rejectPostulationDto: RejectPostulationDto) {
    return await this.rejectPostulationUseCase.execute(rejectPostulationDto);
  }

  async getPostulationsByUser(
    getPostulationsByUserDto: GetPostulationsByUserDto,
  ) {
    return await this.getPostulationsByUserUseCase.execute(
      getPostulationsByUserDto,
    );
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
