import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { CancelPostulationDto } from '../dtos/cancel-postulation.dto';
import { CreatePostulationDto } from '../dtos/create-postulation.dto';
import { GetPostulationsByUserDto } from '../dtos/get-postulations-by-user.dto';
import { GetPostulationsDto } from '../dtos/get-postulations.dto';
import { RejectPostulationDto } from '../dtos/reject-postulation.dto';
import { SubmitEvaluationDto } from '../dtos/submit-evaluation.dto';
import { PostulationStatusService } from '../services/postulation-status.service';
import { PostulationsService } from '../services/postulations.service';

@Controller()
export class PostulationsController {
  constructor(
    private readonly postulationsService: PostulationsService,
    private readonly postulationStatusService: PostulationStatusService,
  ) {}

  @MessagePattern('postulations_get_statuses')
  async getPostulationStatuses() {
    return await this.postulationStatusService.getAllStatuses();
  }

  @MessagePattern('createPostulation')
  async createPostulation(
    @Payload()
    data: {
      createPostulationDto: CreatePostulationDto;
      currentUserId: number;
    },
  ) {
    try {
      const result = await this.postulationsService.createPostulation(
        data.createPostulationDto,
        data.currentUserId,
      );
      return result;
    } catch (error: any) {
      // Si el error ya tiene estructura de RPC (status, message, code), re-lanzar como RpcException
      if (error?.status || error?.statusCode) {
        throw new RpcException({
          status: error.status || error.statusCode,
          statusCode: error.status || error.statusCode,
          message: error.message,
          code: error.code,
        });
      }
      // Si es un RpcException, obtener el error interno
      if (error instanceof RpcException) {
        const rpcError = error.getError();
        throw new RpcException(rpcError);
      }
      throw error;
    }
  }

  @MessagePattern('approvePostulation')
  async approvePostulation(
    @Payload() data: { postulationId: number; currentUserId: number },
  ) {
    return await this.postulationsService.approvePostulation(data);
  }

  @MessagePattern('cancelPostulation')
  async cancelPostulation(
    @Payload() data: { postulationId: number; currentUserId: number },
  ) {
    const cancelPostulationDto: CancelPostulationDto = {
      postulationId: data.postulationId,
      currentUserId: data.currentUserId,
    };
    return await this.postulationsService.cancelPostulation(
      cancelPostulationDto,
    );
  }

  @MessagePattern('rejectPostulation')
  async rejectPostulation(
    @Payload() data: { postulationId: number; currentUserId: number },
  ) {
    const rejectPostulationDto: RejectPostulationDto = {
      postulationId: data.postulationId,
      currentUserId: data.currentUserId,
    };
    return await this.postulationsService.rejectPostulation(
      rejectPostulationDto,
    );
  }

  @MessagePattern('getPostulationsByUser')
  async getPostulationsByUser(
    @Payload() data: { userId: number; page?: number; limit?: number },
  ) {
    const getPostulationsByUserDto: GetPostulationsByUserDto = {
      userId: data.userId,
      page: data.page || 1,
      limit: data.limit || 10,
    };
    return await this.postulationsService.getPostulationsByUser(
      getPostulationsByUserDto,
    );
  }

  @MessagePattern('getPostulationsForProject')
  async getPostulations(
    @Payload()
    data: {
      getPostulationsDto: GetPostulationsDto;
      currentUserId: number;
    },
  ) {
    try {
      const result = await this.postulationsService.getPostulations(
        data.getPostulationsDto,
        data.currentUserId,
      );
      return result;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  @MessagePattern('submitEvaluation')
  async submitEvaluation(
    @Payload()
    data: {
      submitEvaluationDto: SubmitEvaluationDto;
    },
  ) {
    return await this.postulationsService.submitEvaluation(
      data.submitEvaluationDto,
    );
  }
}
