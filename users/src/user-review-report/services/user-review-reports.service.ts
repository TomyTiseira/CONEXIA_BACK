import { Injectable } from '@nestjs/common';
import { CreateUserReviewReportDto } from '../dto/create-user-review-report.dto';
import { GetUserReviewReportsListDto } from '../dto/get-user-review-reports-list.dto';
import { UserReviewReport } from '../entities/user-review-report.entity';
import { OrderByUserReviewReport } from '../enums/orderby-user-review-report.enum';
import { UserReviewReportRepository } from '../repositories/user-review-report.repository';
import { UserReviewReportValidationService } from './user-review-report-validation.service';

@Injectable()
export class UserReviewReportsService {
  constructor(
    private readonly userReviewReportRepository: UserReviewReportRepository,
    private readonly userReviewReportValidationService: UserReviewReportValidationService,
  ) {}

  /**
   * Crea un nuevo reporte de reseña de usuario
   * @param createUserReviewReportDto - Datos del reporte
   * @param userId - ID del usuario que reporta
   * @returns El reporte creado
   */
  async createReport(
    createUserReviewReportDto: CreateUserReviewReportDto,
    userId: number,
  ): Promise<UserReviewReport> {
    // Validar que la reseña existe
    await this.userReviewReportValidationService.validateUserReviewExists(
      createUserReviewReportDto.userReviewId,
    );

    // Validar que el usuario no haya reportado ya la reseña
    await this.userReviewReportValidationService.validateUserNotAlreadyReported(
      createUserReviewReportDto.userReviewId,
      userId,
    );

    // Validar el motivo del reporte
    this.userReviewReportValidationService.validateReportReason(
      createUserReviewReportDto.reason,
      createUserReviewReportDto.otherReason,
    );

    // Crear el reporte
    const report = await this.userReviewReportRepository.create({
      ...createUserReviewReportDto,
      reporterId: userId,
    });

    return report;
  }

  /**
   * Obtiene todos los reportes de una reseña específica
   * @param userReviewId - ID de la reseña
   * @param page - Página actual
   * @param limit - Límite de elementos por página
   * @returns Lista de reportes
   */
  async getUserReviewReports(
    userReviewId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[UserReviewReport[], number]> {
    return this.userReviewReportRepository.findReportsByUserReview(
      userReviewId,
      page,
      limit,
    );
  }

  /**
   * Obtiene reseñas con conteo de reportes
   * @param getUserReviewReportsListDto - Filtros y ordenamiento
   * @returns Lista de reseñas con conteo de reportes
   */
  async getUserReviewsWithReportCounts(
    getUserReviewReportsListDto: GetUserReviewReportsListDto,
  ): Promise<[any[], number]> {
    const { orderBy, page = 1, limit = 10 } = getUserReviewReportsListDto;
    return this.userReviewReportRepository.getUserReviewsWithReportCounts(
      orderBy as OrderByUserReviewReport,
      page,
      limit,
    );
  }

  /**
   * Obtiene el conteo de reportes de una reseña
   * @param userReviewId - ID de la reseña
   * @returns Número de reportes
   */
  async getReportCountByUserReview(userReviewId: number): Promise<number> {
    return this.userReviewReportRepository.getReportCountByUserReview(
      userReviewId,
    );
  }

  /**
   * Verifica si una reseña tiene reportes
   * @param userReviewId - ID de la reseña
   * @returns true si tiene reportes, false en caso contrario
   */
  async userReviewHasReports(userReviewId: number): Promise<boolean> {
    const count = await this.getReportCountByUserReview(userReviewId);
    return count > 0;
  }

  async getUserReviewIdsWithReports(): Promise<number[]> {
    return await this.userReviewReportRepository.getUserReviewIdsWithReports();
  }

  async getTotalReportCount(): Promise<number> {
    return await this.userReviewReportRepository.getTotalReportCount();
  }

  /**
   * Obtiene todos los reportes activos con información de la reseña
   * @returns Lista de reportes activos
   */
  async getActiveReports() {
    const reports =
      await this.userReviewReportRepository.findActiveReportsWithUserReviews();
    return reports.map((report) => ({
      id: report.id,
      reporterId: report.reporterId,
      reason: report.reason,
      otherReason: report.otherReason,
      description: report.description,
      createdAt: report.createdAt,
      isActive: report.isActive,
      updatedAt: report.updatedAt,
      userReviewId: report.userReviewId,
      reviewedUserId: report.userReview?.reviewedUserId || null,
      reviewerUserId: report.userReview?.reviewerUserId || null,
      resourceDescription: report.userReview?.description || null,
    }));
  }

  /**
   * Marca como inactivos reportes anteriores a una fecha
   */
  async softDeleteOldReports(oneYearAgo: Date) {
    return await this.userReviewReportRepository.softDeleteOldReports(
      oneYearAgo,
    );
  }

  /**
   * Desactiva reportes específicos por ID
   */
  async deactivateReports(reportIds: number[]) {
    return await this.userReviewReportRepository.deactivateReports(reportIds);
  }
}
