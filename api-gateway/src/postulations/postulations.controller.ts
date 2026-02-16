import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { memoryStorage } from 'multer';
import { catchError } from 'rxjs';
import { ROLES } from '../auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { RequiresActiveAccount } from '../auth/decorators/requires-active-account.decorator';
import { User } from '../auth/decorators/user.decorator';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from '../common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from '../config';
import { ApprovePostulationDto } from './dto/approve-postulation.dto';
import { CancelPostulationDto } from './dto/cancel-postulation.dto';
import { CreatePostulationDto } from './dto/create-postulation.dto';
import { GetPostulationsByUserDto } from './dto/get-postulations-by-user.dto';
import { GetPostulationsDto } from './dto/get-postulations.dto';
import { RejectPostulationDto } from './dto/reject-postulation.dto';
import { SubmitEvaluationDto } from './dto/submit-evaluation.dto';
import { RpcExceptionFilter } from '../common/filters/rpc-exception.filter';

@Controller('postulations')
@UseFilters(RpcExceptionFilter)
export class PostulationsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  @RequiresActiveAccount([ROLES.USER]) // ⭐ Usuarios suspendidos no pueden postularse
  @Post('apply')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'cv', maxCount: 1 }], {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new RpcException({
              status: 400,
              message: 'Only PDF files are allowed',
            }),
            false,
          );
        }
      },
    }),
  )
  async createPostulation(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles()
    files: {
      cv?: any[];
    } = {},
    @User() user: AuthenticatedUser,
  ) {
    const body = (req.body as { [key: string]: any }) ?? {};

    // Parse answers if they come as JSON string
    if (body.answers && typeof body.answers === 'string') {
      try {
        body.answers = JSON.parse(body.answers);
      } catch {
        throw new RpcException({
          status: 400,
          message: 'Invalid answers format',
        });
      }
    }

    // Si answers es un string vacío o un array vacío, eliminarlo
    if (
      body.answers === '' ||
      (Array.isArray(body.answers) && body.answers.length === 0)
    ) {
      delete body.answers;
    }

    // Parse investorAmount if it comes as string
    if (body.investorAmount && typeof body.investorAmount === 'string') {
      body.investorAmount = Number(body.investorAmount);
    }

    const dto = plainToInstance(CreatePostulationDto, body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new RpcException({
        status: 400,
        message: 'Validation failed',
        errors: errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
        })),
      });
    }

    // CV is optional - will be validated by the use case based on role's applicationTypes
    const payload: any = {
      createPostulationDto: {
        ...dto,
        userId: user.id,
      },
      currentUserId: user.id,
    };

    // Add CV data if file was uploaded (fileFilter already validated PDF type)
    if (files.cv?.[0]) {
      payload.createPostulationDto.cvData =
        files.cv[0].buffer.toString('base64');
      payload.createPostulationDto.cvOriginalName = files.cv[0].originalname;
      payload.createPostulationDto.cvMimetype = files.cv[0].mimetype;
    }

    return this.client.send('createPostulation', payload);
  }

  @AuthRoles([ROLES.USER])
  @Post(':postulationId/submit-evaluation')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'evaluation', maxCount: 1 }], {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/jpg',
        ];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new RpcException({
              status: 400,
              message: 'Only PDF, PNG and JPG files are allowed for evaluation',
            }),
            false,
          );
        }
      },
    }),
  )
  async submitEvaluation(
    @Req() req: AuthenticatedRequest,
    @Param('postulationId') postulationId: string,
    @UploadedFiles()
    files: {
      evaluation?: any[];
    } = {},
    @User() user: AuthenticatedUser,
  ) {
    const body = (req.body as { [key: string]: any }) ?? {};

    const dto = plainToInstance(SubmitEvaluationDto, body);
    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new RpcException({
        status: 400,
        message: 'Validation failed',
        errors: errors.map((e) => ({
          property: e.property,
          constraints: e.constraints,
        })),
      });
    }

    const payload: any = {
      submitEvaluationDto: {
        ...dto,
        postulationId: Number(postulationId),
        userId: user.id,
      },
    };

    // Add evaluation file data if uploaded
    if (files.evaluation?.[0]) {
      const evaluationFile = files.evaluation[0];

      // Convert file buffer to base64
      const base64Data = evaluationFile.buffer.toString('base64');

      payload.submitEvaluationDto.evaluationData = base64Data;
      payload.submitEvaluationDto.evaluationOriginalName =
        evaluationFile.originalname;
      payload.submitEvaluationDto.evaluationMimetype = evaluationFile.mimetype;
    }

    return this.client.send('submitEvaluation', payload);
  }

  @AuthRoles([ROLES.USER])
  @Post('approve')
  approvePostulation(
    @User() user: AuthenticatedUser,
    @Body() dto: ApprovePostulationDto,
  ) {
    return this.client
      .send('approvePostulation', {
        currentUserId: user.id,
        postulationId: dto.postulationId,
      })
      .pipe(
        catchError((error) => {
          console.error('Error in approvePostulation:', error);
          throw new RpcException(error);
        }),
      );
  }

  @Get('statuses')
  getPostulationStatuses() {
    return this.client.send('postulations_get_statuses', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @AuthRoles([ROLES.USER])
  @Get('project/:projectId')
  getPostulations(
    @Query() query: GetPostulationsDto,
    @User() user: AuthenticatedUser,
    @Param('projectId') projectId: string,
  ) {
    return this.client
      .send('getPostulationsForProject', {
        getPostulationsDto: {
          ...query,
          projectId: Number(projectId),
        },
        currentUserId: user.id,
      })
      .pipe(
        catchError((error) => {
          console.error('Error in getPostulations:', error);
          throw new RpcException(error);
        }),
      );
  }

  @AuthRoles([ROLES.USER])
  @Post('cancel')
  cancelPostulation(
    @User() user: AuthenticatedUser,
    @Body() dto: CancelPostulationDto,
  ) {
    return this.client
      .send('cancelPostulation', {
        currentUserId: user.id,
        postulationId: dto.postulationId,
      })
      .pipe(
        catchError((error) => {
          console.error('Error in cancelPostulation:', error);
          throw new RpcException(error);
        }),
      );
  }

  @AuthRoles([ROLES.USER])
  @Post('reject')
  rejectPostulation(
    @User() user: AuthenticatedUser,
    @Body() dto: RejectPostulationDto,
  ) {
    return this.client
      .send('rejectPostulation', {
        currentUserId: user.id,
        postulationId: dto.postulationId,
      })
      .pipe(
        catchError((error) => {
          console.error('Error in rejectPostulation:', error);
          throw new RpcException(error);
        }),
      );
  }

  @AuthRoles([ROLES.USER])
  @Get('me')
  getPostulationsByUser(
    @Query() query: GetPostulationsByUserDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('getPostulationsByUser', {
        userId: user.id,
        page: query.page,
        limit: query.limit,
      })
      .pipe(
        catchError((error) => {
          console.error('Error in getPostulationsByUser:', error);
          throw new RpcException(error);
        }),
      );
  }

  /**
   * Endpoint para ejecutar manualmente el job de expiración de evaluaciones
   * Solo para testing - REMOVER EN PRODUCCIÓN
   */
  @AuthRoles([ROLES.ADMIN])
  @Post('run-expired-evaluations-job')
  runExpiredEvaluationsJob() {
    return this.client.send('runExpiredEvaluationsJob', {}).pipe(
      catchError((error) => {
        console.error('Error in runExpiredEvaluationsJob:', error);
        throw new RpcException(error);
      }),
    );
  }
}
