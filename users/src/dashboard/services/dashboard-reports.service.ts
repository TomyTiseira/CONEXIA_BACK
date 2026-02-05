import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from 'src/config';
import { UserReviewReport } from 'src/user-review-report/entities/user-review-report.entity';
import { Repository } from 'typeorm';
import {
  ReportsByReasonDto,
  ReportsByStatusDto,
  ReportsByTypeDto,
  ReportsMetricsDto,
} from '../dto/moderator-dashboard-metrics.dto';

type ReportWithReason = {
  reason?: string | null;
  isActive?: boolean;
};

@Injectable()
export class DashboardReportsService {
  constructor(
    @InjectRepository(UserReviewReport)
    private readonly userReviewReportRepository: Repository<UserReviewReport>,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async getAdminReportMetrics(): Promise<ReportsMetricsDto> {
    try {
      // Obtener reportes de reseñas de usuarios (users microservice) - TODOS los reportes
      const userReviewReports = await this.userReviewReportRepository.find();

      // Obtener reportes de proyectos (projects microservice) - TODOS los reportes
      let projectReports: ReportWithReason[] = [];
      try {
        const projectReportsResponse = await firstValueFrom(
          this.client.send<ReportWithReason[]>('getAllProjectReports', {}),
        );
        projectReports = projectReportsResponse || [];
      } catch (error) {
        console.error('Error fetching project reports:', error);
      }

      // Obtener reportes de servicios (services microservice) - TODOS los reportes
      let serviceReports: ReportWithReason[] = [];
      try {
        const serviceReportsResponse = await firstValueFrom(
          this.client.send<ReportWithReason[]>('getAllServiceReports', {}),
        );
        serviceReports = serviceReportsResponse || [];
      } catch (error) {
        console.error('Error fetching service reports:', error);
      }

      // Obtener reportes de publicaciones (communities microservice) - TODOS los reportes
      let publicationReports: ReportWithReason[] = [];
      try {
        const publicationReportsResponse = await firstValueFrom(
          this.client.send<ReportWithReason[]>('getAllPublicationReports', {}),
        );
        publicationReports = publicationReportsResponse || [];
      } catch (error) {
        console.error('Error fetching publication reports:', error);
      }

      // Obtener reportes de comentarios (communities microservice) - TODOS los reportes
      let commentReports: ReportWithReason[] = [];
      try {
        const commentReportsResponse = await firstValueFrom(
          this.client.send<ReportWithReason[]>('getAllCommentReports', {}),
        );
        commentReports = commentReportsResponse || [];
      } catch (error) {
        console.error('Error fetching comment reports:', error);
      }

      // Obtener reportes de reseñas de servicios (services microservice) - TODOS los reportes
      let serviceReviewReports: ReportWithReason[] = [];
      try {
        const serviceReviewReportsResponse = await firstValueFrom(
          this.client.send<ReportWithReason[]>(
            'getAllServiceReviewReports',
            {},
          ),
        );
        serviceReviewReports = serviceReviewReportsResponse || [];
      } catch (error) {
        console.error('Error fetching service review reports:', error);
      }

      // Separar reportes activos e inactivos/resueltos
      const activeUserReviews = userReviewReports.filter((r) => r.isActive);
      const resolvedUserReviews = userReviewReports.filter((r) => !r.isActive);

      const activeProjects = projectReports.filter((r) => r.isActive !== false);
      const resolvedProjects = projectReports.filter(
        (r) => r.isActive === false,
      );

      const activeServices = serviceReports.filter((r) => r.isActive !== false);
      const resolvedServices = serviceReports.filter(
        (r) => r.isActive === false,
      );

      const activePublications = publicationReports.filter(
        (r) => r.isActive !== false,
      );
      const resolvedPublications = publicationReports.filter(
        (r) => r.isActive === false,
      );

      const activeComments = commentReports.filter((r) => r.isActive !== false);
      const resolvedComments = commentReports.filter(
        (r) => r.isActive === false,
      );

      const activeServiceReviews = serviceReviewReports.filter(
        (r) => r.isActive !== false,
      );
      const resolvedServiceReviews = serviceReviewReports.filter(
        (r) => r.isActive === false,
      );

      // Consolidar todos los reportes
      const totalReports =
        userReviewReports.length +
        projectReports.length +
        serviceReports.length +
        publicationReports.length +
        commentReports.length +
        serviceReviewReports.length;

      const activeReports =
        activeUserReviews.length +
        activeProjects.length +
        activeServices.length +
        activePublications.length +
        activeComments.length +
        activeServiceReviews.length;

      const resolvedReports =
        resolvedUserReviews.length +
        resolvedProjects.length +
        resolvedServices.length +
        resolvedPublications.length +
        resolvedComments.length +
        resolvedServiceReviews.length;

      // Por tipo con desglose activo/resuelto
      const byType: ReportsByTypeDto[] = [
        {
          type: 'Reseñas de usuarios',
          count: userReviewReports.length,
          active: activeUserReviews.length,
          resolved: resolvedUserReviews.length,
        },
        {
          type: 'Proyectos',
          count: projectReports.length,
          active: activeProjects.length,
          resolved: resolvedProjects.length,
        },
        {
          type: 'Servicios',
          count: serviceReports.length,
          active: activeServices.length,
          resolved: resolvedServices.length,
        },
        {
          type: 'Publicaciones',
          count: publicationReports.length,
          active: activePublications.length,
          resolved: resolvedPublications.length,
        },
        {
          type: 'Comentarios',
          count: commentReports.length,
          active: activeComments.length,
          resolved: resolvedComments.length,
        },
        {
          type: 'Reseñas de servicios',
          count: serviceReviewReports.length,
          active: activeServiceReviews.length,
          resolved: resolvedServiceReviews.length,
        },
      ].filter((item) => item.count > 0);

      // Por estado - mapear inactivos como "Resuelto"
      const byStatus: ReportsByStatusDto[] = [];
      if (activeReports > 0) {
        byStatus.push({
          status: 'Activo',
          count: activeReports,
        });
      }
      if (resolvedReports > 0) {
        byStatus.push({
          status: 'Resuelto',
          count: resolvedReports,
        });
      }

      // Por motivo - consolidar motivos de todos los tipos con desglose activo/resuelto
      const reasonsMap = new Map<
        string,
        { active: number; resolved: number }
      >();

      // Helper para agregar motivos
      const addReasons = (reports: ReportWithReason[], isActive: boolean) => {
        reports.forEach((report) => {
          const reason = report.reason || 'Sin especificar';
          const current = reasonsMap.get(reason) || { active: 0, resolved: 0 };
          if (isActive) {
            current.active += 1;
          } else {
            current.resolved += 1;
          }
          reasonsMap.set(reason, current);
        });
      };

      // Agregar motivos de todos los tipos de reportes
      addReasons(activeUserReviews, true);
      addReasons(resolvedUserReviews, false);
      addReasons(activeProjects, true);
      addReasons(resolvedProjects, false);
      addReasons(activeServices, true);
      addReasons(resolvedServices, false);
      addReasons(activePublications, true);
      addReasons(resolvedPublications, false);
      addReasons(activeComments, true);
      addReasons(resolvedComments, false);
      addReasons(activeServiceReviews, true);
      addReasons(resolvedServiceReviews, false);

      const byReason: ReportsByReasonDto[] = Array.from(
        reasonsMap.entries(),
      ).map(([reason, counts]) => ({
        reason,
        count: counts.active + counts.resolved,
        active: counts.active,
        resolved: counts.resolved,
      }));

      return {
        totalReports,
        activeReports,
        resolvedReports,
        byStatus,
        byType,
        byReason,
      };
    } catch (error) {
      console.error('Error getting admin report metrics:', error);
      return {
        totalReports: 0,
        activeReports: 0,
        resolvedReports: 0,
        byStatus: [],
        byType: [],
        byReason: [],
      };
    }
  }
}
