import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { RpcExceptionFilter } from 'src/common/filters/rpc-exception.filter';
import { AuthenticatedUser } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from 'src/config';
import { ResolveAnalysisDto } from './dto';

@Controller('moderation')
@UseFilters(RpcExceptionFilter)
export class ModerationController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * Analiza todos los reportes activos y genera análisis de moderación con IA
   * Solo accesible para administradores y moderadores
   */
  @Post('analyze')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  analyzeReports(@User() user: AuthenticatedUser) {
    return this.client
      .send('analyzeReports', {
        triggeredBy: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * Obtiene los resultados de análisis de moderación
   * Puede filtrar por estado (resuelto/pendiente)
   */
  @Get('results')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getResults(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('resolved') resolved?: string,
    @Query('classification') classification?: string,
  ) {
    return this.client
      .send('getModerationResults', {
        page: page || 1,
        limit: limit || 10,
        resolved:
          resolved === 'true' ? true : resolved === 'false' ? false : undefined,
        classification,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * Marca un análisis como resuelto y ejecuta la acción correspondiente
   */
  @Patch('resolve/:id')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  resolveAnalysis(
    @Param('id', ParseIntPipe) id: number,
    @Body() resolveDto: ResolveAnalysisDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.client
      .send('resolveModerationAnalysis', {
        analysisId: id,
        resolveDto,
        moderatorId: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * Obtiene los detalles completos de todos los reportes analizados por la IA
   * Devuelve reportes clasificados por tipo (servicios, proyectos, publicaciones)
   */
  @Get('analyzed-reports/:analysisId')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getAnalyzedReportsDetails(
    @Param('analysisId', ParseIntPipe) analysisId: number,
  ) {
    return this.client
      .send('getAnalyzedReportsDetails', {
        analysisId,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }

  /**
   * 🧪 ENDPOINT DE TESTING: Ejecuta manualmente el proceso de reactivación de suspensiones expiradas
   * Normalmente se ejecuta automáticamente todos los días a las 2 AM
   * Solo para administradores
   */
  @Post('trigger-reactivation')
  @AuthRoles([ROLES.ADMIN])
  triggerReactivation(@User() user: AuthenticatedUser) {
    return this.client
      .send('triggerReactivation', {
        triggeredBy: user.id,
      })
      .pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      );
  }
}
