import { Injectable } from '@nestjs/common';
import { UserNotFoundException } from '../../common/exceptions/project.exceptions';
import { UsersClientService } from '../../common/services/users-client.service';
import { CreateReportDto } from '../dtos/create-report.dto';
import { GetReportsDto } from '../dtos/get-reports.dto';
import { Report } from '../entities/report.entity';
import { OrderByReport } from '../enum/orderby-report.enum';
import { ReportRepository } from '../repositories/report.repository';
import { ReportValidationService } from './report-validation.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly reportValidationService: ReportValidationService,
    private readonly usersClientService: UsersClientService,
  ) {}

  /**
   * Crea un nuevo reporte de proyecto
   * @param createReportDto - Datos del reporte
   * @param userId - ID del usuario que reporta
   * @returns El reporte creado
   */
  async createReport(
    createReportDto: CreateReportDto,
    userId: number,
  ): Promise<Report> {
    // Validar que el proyecto existe y está activo
    await this.reportValidationService.validateProjectExistsAndActive(
      createReportDto.projectId,
    );

    // Validar que el usuario esté activo y tenga rol de usuario
    const userExists = await this.usersClientService.validateUserExists(userId);
    if (!userExists) {
      throw new UserNotFoundException(userId);
    }

    // Validar que el usuario no haya reportado ya el proyecto
    await this.reportValidationService.validateUserNotAlreadyReported(
      createReportDto.projectId,
      userId,
    );

    // Validar el motivo del reporte
    this.reportValidationService.validateReportReason(
      createReportDto.reason,
      createReportDto.otherReason,
    );

    // Crear el reporte
    const report = await this.reportRepository.create({
      ...createReportDto,
      reporterId: userId,
    });

    return report;
  }

  /**
   * Obtiene todos los reportes de un proyecto específico
   * @param projectId - ID del proyecto
   * @returns Lista de reportes con información del usuario
   */
  async getProjectReports(
    projectId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[any[], number]> {
    // Validar que el proyecto existe y NO está eliminado
    await this.reportValidationService.validateProjectExistsAndActive(
      projectId,
    );

    return this.reportRepository.findReportsByProject(projectId, page, limit);
  }

  /**
   * Obtiene proyectos con reportes, ordenados por cantidad o fecha
   * @param getReportsDto - Filtros y ordenamiento
   * @returns Lista de proyectos con conteo de reportes
   */
  async getProjectsWithReports(
    getReportsDto: GetReportsDto,
  ): Promise<[any[], number]> {
    const { orderBy, page = 1, limit = 10 } = getReportsDto;
    return this.reportRepository.getProjectsWithReportCounts(
      orderBy as OrderByReport,
      page,
      limit,
    );
  }

  /**
   * Obtiene la cantidad de reportes de un proyecto
   * @param projectId - ID del proyecto
   * @returns Cantidad de reportes
   */
  async getReportCountByProject(projectId: number): Promise<number> {
    return this.reportRepository.getReportCountByProject(projectId);
  }

  /**
   * Verifica si un proyecto tiene reportes
   * @param projectId - ID del proyecto
   * @returns true si tiene reportes, false en caso contrario
   */
  async projectHasReports(projectId: number): Promise<boolean> {
    const count = await this.getReportCountByProject(projectId);
    return count > 0;
  }

  async getProjectIdsWithReports(): Promise<number[]> {
    return await this.reportRepository.getProjectIdsWithReports();
  }

  async getTotalReportCount(): Promise<number> {
    return await this.reportRepository.getTotalReportCount();
  }

  /**
   * Obtiene todos los reportes activos con información del proyecto
   * @returns Lista de reportes activos con datos necesarios para moderación
   */
  async getActiveReports() {
    const reports = await this.reportRepository.findActiveReportsWithProjects();
    return reports.map((report) => ({
      id: report.id,
      reporterId: report.reporterId,
      reason: report.reason,
      otherReason: report.otherReason,
      description: report.description,
      createdAt: report.createdAt,
      isActive: report.isActive,
      updatedAt: report.updatedAt,
      reportedUserId: report.project?.userId || null,
      projectId: report.projectId,
      resourceTitle: report.project?.title || null,
      resourceDescription: report.project?.description || null,
    }));
  }

  /**
   * Marca como inactivos reportes anteriores a una fecha
   */
  async softDeleteOldReports(oneYearAgo: Date) {
    return await this.reportRepository.softDeleteOldReports(oneYearAgo);
  }

  /**
   * Desactiva reportes específicos por ID
   */
  async deactivateReports(reportIds: number[]) {
    return await this.reportRepository.deactivateReports(reportIds);
  }

  /**
   * Obtiene reportes por sus IDs con información del proyecto
   * Para el sistema de moderación
   */
  async getReportsByIds(reportIds: number[]): Promise<any[]> {
    if (!reportIds || reportIds.length === 0) return [];

    const reports = await this.reportRepository.findReportsByIds(reportIds);
    return reports.map((report: Report) => ({
      id: report.id,
      reporterId: report.reporterId,
      reason: report.reason,
      otherReason: report.otherReason,
      description: report.description,
      createdAt: report.createdAt,
      isActive: report.isActive,
      updatedAt: report.updatedAt,
      reportedUserId: report.project?.userId || null,
      projectId: report.projectId,
      resourceTitle: report.project?.title || null,
      resourceDescription: report.project?.description || null,
    }));
  }
}
