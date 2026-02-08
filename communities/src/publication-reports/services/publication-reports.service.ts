import { Injectable } from '@nestjs/common';
import { CreatePublicationReportDto } from '../dtos/create-publication-report.dto';
import { GetPublicationReportsDto } from '../dtos/get-publication-reports.dto';
import { PublicationReport } from '../entities/publication-report.entity';
import { OrderByPublicationReport } from '../enums/orderby-publication-report.enum';
import { PublicationReportRepository } from '../repositories/publication-report.repository';
import { PublicationReportValidationService } from './publication-report-validation.service';

@Injectable()
export class PublicationReportsService {
  constructor(
    private readonly publicationReportRepository: PublicationReportRepository,
    private readonly publicationReportValidationService: PublicationReportValidationService,
  ) {}

  /**
   * Crea un nuevo reporte de publicación
   * @param createReportDto - Datos del reporte
   * @param userId - ID del usuario que reporta
   * @returns El reporte creado
   */
  async createReport(
    createReportDto: CreatePublicationReportDto,
    userId: number,
  ): Promise<PublicationReport> {
    // Validar que la publicación existe y está activa
    await this.publicationReportValidationService.validatePublicationExistsAndActive(
      createReportDto.publicationId,
    );

    // Validar que el usuario no haya reportado ya la publicación
    await this.publicationReportValidationService.validateUserNotAlreadyReported(
      createReportDto.publicationId,
      userId,
    );

    // Validar el motivo del reporte
    this.publicationReportValidationService.validateReportReason(
      createReportDto.reason,
      createReportDto.otherReason,
    );

    // Crear el reporte
    const report = await this.publicationReportRepository.createReport({
      ...createReportDto,
      reporterId: userId,
    });

    return report;
  }

  /**
   * Obtiene todos los reportes con paginación
   * @param page - Página actual
   * @param limit - Límite de elementos por página
   * @returns Lista de reportes paginados
   */
  async getAllReports(
    page: number = 1,
    limit: number = 10,
  ): Promise<[PublicationReport[], number]> {
    return this.publicationReportRepository.findReportsPaginated(page, limit);
  }

  /**
   * Obtiene la cantidad total de reportes
   * @returns Cantidad total de reportes
   */
  async getTotalReportCount(): Promise<number> {
    return this.publicationReportRepository.getTotalReportCount();
  }

  /**
   * Obtiene la cantidad de reportes de una publicación
   * @param publicationId - ID de la publicación
   * @returns Cantidad de reportes
   */
  async getReportCountByPublication(publicationId: number): Promise<number> {
    return this.publicationReportRepository.getReportCountByPublication(
      publicationId,
    );
  }

  /**
   * Verifica si una publicación tiene reportes
   * @param publicationId - ID de la publicación
   * @returns true si tiene reportes, false en caso contrario
   */
  async publicationHasReports(publicationId: number): Promise<boolean> {
    const count = await this.getReportCountByPublication(publicationId);
    return count > 0;
  }

  /**
   * Obtiene los IDs de publicaciones que tienen reportes
   * @returns Array de IDs de publicaciones con reportes
   */
  async getPublicationIdsWithReports(): Promise<number[]> {
    return this.publicationReportRepository.getPublicationIdsWithReports();
  }

  /**
   * Obtiene publicaciones con reportes, ordenados por cantidad o fecha
   * @param getReportsDto - Filtros y ordenamiento
   * @returns Lista de publicaciones con conteo de reportes
   */
  async getPublicationsWithReports(
    getReportsDto: GetPublicationReportsDto,
  ): Promise<[any[], number]> {
    const { orderBy, page = 1, limit = 10 } = getReportsDto;
    return this.publicationReportRepository.getPublicationsWithReportCounts(
      orderBy as OrderByPublicationReport,
      page,
      limit,
    );
  }

  /**
   * Obtiene todos los reportes de una publicación específica
   * @param publicationId - ID de la publicación
   * @param page - Página actual
   * @param limit - Límite de elementos por página
   * @returns Lista de reportes con información del usuario
   */
  async getPublicationReports(
    publicationId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[PublicationReport[], number]> {
    return this.publicationReportRepository.findReportsByPublication(
      publicationId,
      page,
      limit,
    );
  }

  /**
   * Obtiene reportes activos con información de la publicación y el usuario reportado
   * Para el sistema de moderación
   */
  async getActiveReports() {
    const reports =
      await this.publicationReportRepository.findActiveReportsWithPublications();

    // Filtrar reportes huérfanos (publicación eliminada)
    return reports
      .filter((report) => report.publication != null)
      .map((report) => ({
        id: report.id,
        reporterId: report.reporterId,
        reason: report.reason,
        otherReason: report.otherReason,
        description: report.description,
        createdAt: report.createdAt,
        isActive: report.isActive,
        updatedAt: report.updatedAt,
        reportedUserId: report.publication.userId,
        publicationId: report.publication.id,
        resourceTitle: null,
        resourceDescription: report.publication.description || null,
      }));
  }

  /**
   * Obtiene TODOS los reportes (activos e inactivos)
   * Para métricas del dashboard de moderación
   */
  async getAllReportsForMetrics() {
    const reports = await this.publicationReportRepository.find({
      select: ['id', 'reason', 'isActive', 'createdAt'],
    });
    return reports.map((report) => ({
      reason: report.reason,
      isActive: report.isActive,
    }));
  }

  /**
   * Marca como inactivos los reportes anteriores a una fecha
   */
  async softDeleteOldReports(oneYearAgo: Date) {
    return await this.publicationReportRepository.softDeleteOldReports(
      oneYearAgo,
    );
  }

  /**
   * Desactiva reportes específicos por ID
   */
  async deactivateReports(reportIds: number[]) {
    return await this.publicationReportRepository.deactivateReports(reportIds);
  }

  /**
   * Obtiene reportes por sus IDs con información de la publicación
   * Para el sistema de moderación
   */
  async getReportsByIds(reportIds: number[]) {
    if (!reportIds || reportIds.length === 0) return [];

    const reports =
      await this.publicationReportRepository.findReportsByIds(reportIds);
    return reports.map((report) => ({
      id: report.id,
      reporterId: report.reporterId,
      reason: report.reason,
      otherReason: report.otherReason,
      description: report.description,
      createdAt: report.createdAt,
      isActive: report.isActive,
      updatedAt: report.updatedAt,
      reportedUserId: report.publication?.userId || null,
      publicationId: report.publication?.id || null,
      resourceTitle: null,
      resourceDescription: report.publication?.description || null,
    }));
  }
}
