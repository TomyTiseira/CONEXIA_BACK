import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { RpcExceptionFilter } from 'src/common/filters/rpc-exception.filter';
import { AuthenticatedUser } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from 'src/config';
import { CreateServiceReviewReportDto } from './dto/create-service-review-report.dto';
import {
  GetServiceReviewReportsDto,
  OrderByServiceReviewReport,
} from './dto/get-service-review-reports.dto';

/**
 * Service Review Reports Controller - API Gateway
 * Maneja los reportes de reseñas de servicios
 */
@Controller('service-review-reports')
@UseFilters(RpcExceptionFilter)
export class ServiceReviewReportsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * POST /service-review-reports
   * Crear un reporte de una reseña de servicio
   * Cualquier usuario puede reportar (excepto el autor de la reseña)
   */
  @Post()
  @AuthRoles([ROLES.USER])
  createServiceReviewReport(
    @Body() createReportDto: CreateServiceReviewReportDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      userId: user.id,
      dto: createReportDto,
    };

    return this.client.send('create_service_review_report', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * GET /service-review-reports
   * Obtener reportes (para moderadores/admins)
   * - Sin serviceReviewId: lista de reseñas reportadas con conteo
   * - Con serviceReviewId: reportes específicos de una reseña
   */
  @Get()
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getServiceReviewReports(@Query() query: GetServiceReviewReportsDto) {
    const payload = {
      page: query.page || 1,
      limit: query.limit || 10,
      orderBy: query.orderBy || OrderByServiceReviewReport.REPORT_COUNT,
      serviceReviewId: query.serviceReviewId,
    };

    return this.client.send('get_service_review_reports', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }
}
