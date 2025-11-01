import { Injectable } from '@nestjs/common';
import { CreateServiceReviewReportDto } from '../../dto/create-service-review-report.dto';
import { ServiceReviewReport } from '../../entities/service-review-report.entity';
import { ServiceReviewReportRepository } from '../../repositories/service-review-report.repository';
import { ServiceReviewReportValidationService } from '../service-review-report-validation.service';

/**
 * Use Case: Crear reporte de reseña de servicio
 * Cualquier usuario puede reportar una reseña, excepto el autor de la misma
 */
@Injectable()
export class CreateServiceReviewReportUseCase {
  constructor(
    private readonly serviceReviewReportRepository: ServiceReviewReportRepository,
    private readonly validationService: ServiceReviewReportValidationService,
  ) {}

  async execute(
    reporterId: number,
    dto: CreateServiceReviewReportDto,
  ): Promise<ServiceReviewReport> {
    const { serviceReviewId, reason, otherReason, description } = dto;

    // 1. Validar que la reseña existe
    const serviceReview =
      await this.validationService.validateServiceReviewExists(serviceReviewId);

    // 2. Validar que no está reportando su propia reseña
    this.validationService.validateNotOwnReview(serviceReview, reporterId);

    // 3. Validar que no haya reportado esta reseña antes
    await this.validationService.validateUserNotAlreadyReported(
      serviceReviewId,
      reporterId,
    );

    // 4. Validar el motivo del reporte
    this.validationService.validateReportReason(reason, otherReason);

    // 5. Crear el reporte
    const report = await this.serviceReviewReportRepository.create({
      serviceReviewId,
      reporterId,
      reason,
      otherReason,
      description,
    });

    return report;
  }
}
