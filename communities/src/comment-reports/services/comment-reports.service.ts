import { Injectable } from '@nestjs/common';
import { CreateCommentReportDto } from '../dtos/create-comment-report.dto';
import { GetCommentReportsDto } from '../dtos/get-comment-reports.dto';
import { CommentReport } from '../entities/comment-report.entity';
import { OrderByCommentReport } from '../enums/orderby-comment-report.enum';
import { CommentReportRepository } from '../repositories/comment-report.repository';
import { CommentReportValidationService } from './comment-report-validation.service';

@Injectable()
export class CommentReportsService {
  constructor(
    private readonly commentReportRepository: CommentReportRepository,
    private readonly commentReportValidationService: CommentReportValidationService,
  ) {}

  /**
   * Crea un nuevo reporte de comentario
   * @param createReportDto - Datos del reporte
   * @param userId - ID del usuario que reporta
   * @returns El reporte creado
   */
  async createReport(
    createReportDto: CreateCommentReportDto,
    userId: number,
  ): Promise<CommentReport> {
    // Validar que el comentario existe y está activo
    await this.commentReportValidationService.validateCommentExistsAndActive(
      createReportDto.commentId,
    );

    // Validar que el usuario no haya reportado ya el comentario
    await this.commentReportValidationService.validateUserNotAlreadyReported(
      createReportDto.commentId,
      userId,
    );

    // Validar el motivo del reporte
    this.commentReportValidationService.validateReportReason(
      createReportDto.reason,
      createReportDto.otherReason,
    );

    // Crear el reporte
    const report = await this.commentReportRepository.createReport({
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
  ): Promise<[CommentReport[], number]> {
    return this.commentReportRepository.findReportsPaginated(page, limit);
  }

  /**
   * Obtiene la cantidad total de reportes
   * @returns Cantidad total de reportes
   */
  async getTotalReportCount(): Promise<number> {
    return this.commentReportRepository.getTotalReportCount();
  }

  /**
   * Obtiene la cantidad de reportes de un comentario
   * @param commentId - ID del comentario
   * @returns Cantidad de reportes
   */
  async getReportCountByComment(commentId: number): Promise<number> {
    return this.commentReportRepository.getReportCountByComment(commentId);
  }

  /**
   * Verifica si un comentario tiene reportes
   * @param commentId - ID del comentario
   * @returns true si tiene reportes, false en caso contrario
   */
  async commentHasReports(commentId: number): Promise<boolean> {
    const count = await this.getReportCountByComment(commentId);
    return count > 0;
  }

  /**
   * Obtiene los IDs de comentarios que tienen reportes
   * @returns Array de IDs de comentarios con reportes
   */
  async getCommentIdsWithReports(): Promise<number[]> {
    return this.commentReportRepository.getCommentIdsWithReports();
  }

  /**
   * Obtiene comentarios con reportes, ordenados por cantidad o fecha
   * @param getReportsDto - Filtros y ordenamiento
   * @returns Lista de comentarios con conteo de reportes
   */
  async getCommentsWithReports(
    getReportsDto: GetCommentReportsDto,
  ): Promise<[any[], number]> {
    const { orderBy, page = 1, limit = 10 } = getReportsDto;
    return this.commentReportRepository.getCommentsWithReportCounts(
      orderBy as OrderByCommentReport,
      page,
      limit,
    );
  }

  /**
   * Obtiene todos los reportes de un comentario específico
   * @param commentId - ID del comentario
   * @param page - Página actual
   * @param limit - Límite de elementos por página
   * @returns Lista de reportes con información del usuario
   */
  async getCommentReports(
    commentId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[CommentReport[], number]> {
    return this.commentReportRepository.findReportsByComment(
      commentId,
      page,
      limit,
    );
  }

  /**
   * Obtiene reportes activos con información del comentario y el usuario reportado
   * Para el sistema de moderación
   */
  async getActiveReports() {
    const reports =
      await this.commentReportRepository.findActiveReportsWithComments();
    
    // Filtrar reportes huérfanos (comentario eliminado)
    return reports
      .filter(report => report.comment != null)
      .map((report) => ({
        id: report.id,
        reporterId: report.reporterId,
        reason: report.reason,
        otherReason: report.otherReason,
        description: report.description,
        createdAt: report.createdAt,
        isActive: report.isActive,
        updatedAt: report.updatedAt,
        reportedUserId: report.comment.userId,
        commentId: report.comment.id,
        publicationId: report.comment.publicationId,
        resourceTitle: null,
        resourceDescription: report.comment.content || null,
      }));
  }

  /**
   * Marca como inactivos los reportes anteriores a una fecha
   */
  async softDeleteOldReports(oneYearAgo: Date) {
    return await this.commentReportRepository.softDeleteOldReports(oneYearAgo);
  }

  /**
   * Desactiva reportes específicos por ID
   */
  async deactivateReports(reportIds: number[]) {
    return await this.commentReportRepository.deactivateReports(reportIds);
  }
}
