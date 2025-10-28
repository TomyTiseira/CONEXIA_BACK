import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { AuthenticatedUser } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from 'src/config';
import { CreateServiceReviewReportDto } from './dto/create-service-review-report.dto';
import { GetServiceReviewReportsDto } from './dto/get-service-review-reports.dto';
import {
  GetServiceReviewsWithReportsDto,
  OrderByServiceReviewReport,
} from './dto/get-service-reviews-with-reports.dto';

/**
 * Service Review Reports Controller - API Gateway
 * Maneja los reportes de reseñas de servicios
 */
@Controller('service-review-reports')
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
   * Obtener reportes de una reseña específica (para moderadores/admins)
   */
  @Get()
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getServiceReviewReports(@Query() query: GetServiceReviewReportsDto) {
    return this.client.send('get_service_review_reports', query).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * GET /service-review-reports/list
   * Obtener lista de reseñas con reportes (para moderadores/admins)
   */
  @Get('list')
  @AuthRoles([ROLES.ADMIN, ROLES.MODERATOR])
  getServiceReviewsWithReports(
    @Query() query: GetServiceReviewsWithReportsDto,
  ) {
    const payload = {
      page: query.page || 1,
      limit: query.limit || 10,
      orderBy: query.orderBy || OrderByServiceReviewReport.REPORT_COUNT,
    };

    return this.client.send('get_service_reviews_with_reports', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }
}
