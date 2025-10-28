import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from 'src/auth/decorators/auth-roles.decorator';
import { User } from 'src/auth/decorators/user.decorator';
import { AuthenticatedUser } from 'src/common/interfaces/authenticatedRequest.interface';
import { NATS_SERVICE } from 'src/config';
import {
  CreateServiceReviewDto,
  GetServiceReviewsDto,
  RespondServiceReviewDto,
  UpdateServiceReviewDto,
} from './dto';

/**
 * Service Reviews Controller - API Gateway
 * Maneja las reseñas de servicios finalizados
 */
@Controller('service-reviews')
export class ServiceReviewsController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  /**
   * POST /service-reviews
   * Crear una reseña de un servicio finalizado
   * Solo clientes que completaron el servicio
   */
  @Post()
  @AuthRoles([ROLES.USER])
  createServiceReview(
    @Body() createServiceReviewDto: CreateServiceReviewDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      userId: user.id,
      dto: createServiceReviewDto,
    };

    return this.client.send('create_service_review', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * GET /service-reviews/service/:serviceId
   * Obtener todas las reseñas de un servicio con paginación
   * Incluye promedio de calificación y total
   * Accesible para usuarios, administradores y moderadores
   */
  @Get('service/:serviceId')
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getServiceReviews(
    @Param('serviceId') serviceId: string,
    @Query() getServiceReviewsDto: GetServiceReviewsDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      serviceId: parseInt(serviceId),
      dto: getServiceReviewsDto,
      userId: user.id, // Ahora siempre estará presente por el guard
    };

    return this.client.send('get_service_reviews', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * GET /service-reviews/hiring/:hiringId
   * Obtener la reseña de una contratación específica
   * Para que el cliente vea si ya reseñó o para moderación
   */
  @Get('hiring/:hiringId')
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getServiceReviewByHiring(@Param('hiringId') hiringId: string) {
    const payload = {
      hiringId: parseInt(hiringId),
    };

    return this.client.send('get_service_review_by_hiring', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * GET /service-reviews/:id
   * Obtener una reseña específica por ID
   * Útil para mostrar una reseña resaltada desde reportes o notificaciones
   */
  @Get(':id')
  @AuthRoles([ROLES.USER, ROLES.ADMIN, ROLES.MODERATOR])
  getServiceReviewById(
    @Param('id') id: string,
    @User() user?: AuthenticatedUser,
  ) {
    const payload = {
      reviewId: parseInt(id),
      userId: user?.id,
    };

    return this.client.send('get_service_review_by_id', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * PATCH /service-reviews/:id
   * Editar el comentario de una reseña (solo el cliente autor)
   */
  @Patch(':id')
  @AuthRoles([ROLES.USER])
  updateServiceReview(
    @Param('id') id: string,
    @Body() updateServiceReviewDto: UpdateServiceReviewDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      reviewId: parseInt(id),
      dto: updateServiceReviewDto,
      userId: user.id,
    };

    return this.client.send('update_service_review', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * PATCH /service-reviews/:id/response
   * Responder a una reseña (solo el dueño del servicio)
   */
  @Patch(':id/response')
  @AuthRoles([ROLES.USER])
  respondToServiceReview(
    @Param('id') id: string,
    @Body() respondServiceReviewDto: RespondServiceReviewDto,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      reviewId: parseInt(id),
      dto: respondServiceReviewDto,
      userId: user.id,
    };

    return this.client.send('respond_to_service_review', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * DELETE /service-reviews/:id
   * Eliminar una reseña (solo el cliente autor)
   */
  @Delete(':id')
  @AuthRoles([ROLES.USER])
  deleteServiceReview(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      reviewId: parseInt(id),
      userId: user.id,
    };

    return this.client.send('delete_service_review', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }

  /**
   * DELETE /service-reviews/:id/response
   * Eliminar la respuesta del dueño del servicio a una reseña
   * Solo el dueño del servicio puede eliminar su respuesta
   */
  @Delete(':id/response')
  @AuthRoles([ROLES.USER])
  deleteServiceReviewResponse(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ) {
    const payload = {
      reviewId: parseInt(id),
      userId: user.id,
    };

    return this.client.send('delete_service_review_response', payload).pipe(
      catchError((error) => {
        throw error;
      }),
    );
  }
}
