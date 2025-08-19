import { Injectable } from '@nestjs/common';
import { ReportReason } from '../../common/enums/report-reason.enum';
import { ProjectNotActiveException } from '../../common/exceptions/postulation.exceptions';
import { ProjectNotFoundException } from '../../common/exceptions/project.exceptions';
import {
  InvalidReportReasonException,
  ProjectAlreadyReportedException,
} from '../../common/exceptions/report.exceptions';
import { Project } from '../../projects/entities/project.entity';
import { ProjectRepository } from '../../projects/repositories/project.repository';
import { ReportRepository } from '../repositories/report.repository';

@Injectable()
export class ReportValidationService {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly reportRepository: ReportRepository,
  ) {}

  /**
   * Valida que un proyecto existe y está activo
   * @param projectId - ID del proyecto
   * @returns El proyecto si existe y está activo
   */
  async validateProjectExistsAndActive(projectId: number): Promise<Project> {
    const project = await this.projectRepository.findById(projectId, true);
    if (!project) {
      throw new ProjectNotFoundException(projectId);
    }

    if (!project.isActive || project.deletedAt) {
      throw new ProjectNotActiveException(projectId);
    }

    return project;
  }

  /**
   * Valida que un usuario no haya reportado ya el proyecto
   * @param projectId - ID del proyecto
   * @param userId - ID del usuario
   */
  async validateUserNotAlreadyReported(
    projectId: number,
    userId: number,
  ): Promise<void> {
    const existingReport = await this.reportRepository.findByProjectAndReporter(
      projectId,
      userId,
    );

    if (existingReport) {
      throw new ProjectAlreadyReportedException(projectId, userId);
    }
  }

  /**
   * Valida que el motivo del reporte sea válido
   * @param reason - Motivo del reporte
   * @param otherReason - Descripción adicional si el motivo es "Otro"
   */
  validateReportReason(reason: ReportReason, otherReason?: string): void {
    if (
      reason === ReportReason.OTHER &&
      (!otherReason || otherReason.trim() === '')
    ) {
      throw new InvalidReportReasonException();
    }

    if (
      reason !== ReportReason.OTHER &&
      otherReason &&
      otherReason.trim() !== ''
    ) {
      throw new InvalidReportReasonException();
    }
  }
}
