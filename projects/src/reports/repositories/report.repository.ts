import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity';
import { OrderByReport } from '../enum/orderby-report.enum';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(Report)
    private readonly repository: Repository<Report>,
  ) {}

  async create(report: Partial<Report>): Promise<Report> {
    const newReport = this.repository.create(report);
    return this.repository.save(newReport);
  }

  async findByProjectAndReporter(
    projectId: number,
    reporterId: number,
  ): Promise<Report | null> {
    return this.repository.findOne({
      where: { projectId, reporterId },
    });
  }

  async findByProject(projectId: number): Promise<Report[]> {
    return this.repository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async findReportsByProject(
    projectId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[any[], number]> {
    const query = this.repository
      .createQueryBuilder('report')
      .select([
        'report.id',
        'report.reason',
        'report.otherReason',
        'report.description',
        'report.createdAt',
        'report.projectId',
        'report.reporterId',
      ])
      .where('report.projectId = :projectId', { projectId })
      .orderBy('report.createdAt', 'DESC');

    // Aplicar paginación
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const data = await query.getMany();
    const total = await this.repository.count({ where: { projectId } });

    return [data, total];
  }

  async getProjectsWithReportCounts(
    orderBy: OrderByReport,
    page: number = 1,
    limit: number = 10,
  ): Promise<[any[], number]> {
    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // Obtener todos los reportes con información básica del proyecto
    // NO incluir reportes de proyectos eliminados
    const queryBuilder = this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.project', 'project')
      .select([
        'report.id',
        'report.projectId',
        'report.reason',
        'report.description',
        'report.createdAt',
        'report.reporterId',
        'project.title',
        'project.isActive',
        'project.deletedAt',
      ])
      .where('project.deletedAt IS NULL')
      .orderBy(
        'report.createdAt',
        orderBy === OrderByReport.LAST_REPORT_DATE ? 'DESC' : 'ASC',
      );

    // Aplicar paginación
    queryBuilder.skip(skip).take(limit);

    const [reports, total] = await queryBuilder.getManyAndCount();

    // Agrupar por proyecto y contar reportes
    const projectMap = new Map<
      number,
      {
        projectId: number;
        projectTitle: string;
        reportCount: number;
        lastReportDate: Date;
        isActive: boolean;
        deletedAt: Date | null;
      }
    >();

    reports.forEach((report) => {
      // Validar que el proyecto existe (protección contra null)
      if (!report.project) {
        return; // Skip este reporte si no tiene proyecto
      }

      const projectId = report.projectId;
      const projectTitle = report.project.title;
      const isActive = report.project.isActive;
      const deletedAt = report.project.deletedAt;

      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          projectId,
          projectTitle,
          reportCount: 0,
          lastReportDate: report.createdAt,
          isActive,
          deletedAt,
        });
      }

      const projectData = projectMap.get(projectId);
      if (projectData) {
        projectData.reportCount++;

        if (report.createdAt > projectData.lastReportDate) {
          projectData.lastReportDate = report.createdAt;
        }
      }
    });

    // Convertir a array y ordenar
    const result = Array.from(projectMap.values());

    if (orderBy === OrderByReport.LAST_REPORT_DATE) {
      result.sort(
        (a, b) =>
          new Date(b.lastReportDate).getTime() -
          new Date(a.lastReportDate).getTime(),
      );
    } else {
      result.sort((a, b) => b.reportCount - a.reportCount);
    }

    return [result, total];
  }

  async getReportCountByProject(projectId: number): Promise<number> {
    return this.repository.count({
      where: { projectId },
    });
  }

  async deleteByProject(projectId: number): Promise<void> {
    await this.repository.delete({ projectId });
  }

  async getProjectIdsWithReports(): Promise<number[]> {
    const results = await this.repository
      .createQueryBuilder('report')
      .select('DISTINCT report.projectId', 'projectId')
      .getRawMany();

    return results.map((result) => result.projectId);
  }

  async getTotalReportCount(): Promise<number> {
    return this.repository.count();
  }
}
