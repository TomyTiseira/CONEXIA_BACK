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

@Injectable()
export class DashboardReportsService {
  constructor(
    @InjectRepository(UserReviewReport)
    private readonly userReviewReportRepository: Repository<UserReviewReport>,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}

  async getAdminReportMetrics(): Promise<ReportsMetricsDto> {
    try {
      // Obtener reportes de reseñas de usuarios (users microservice)
      const userReviewReports = await this.userReviewReportRepository.find({
        where: { isActive: true },
      });

      // Obtener reportes de proyectos (projects microservice)
      let projectReports: any[] = [];
      try {
        const projectReportsResponse = await firstValueFrom(
          this.client.send<any[]>('getActiveProjectReports', {}),
        );
        projectReports = projectReportsResponse || [];
      } catch (error) {
        console.error('Error fetching project reports:', error);
      }

      // Obtener reportes de servicios (services microservice)
      let serviceReports: any[] = [];
      try {
        const serviceReportsResponse = await firstValueFrom(
          this.client.send<any[]>('getActiveServiceReports', {}),
        );
        serviceReports = serviceReportsResponse || [];
      } catch (error) {
        console.error('Error fetching service reports:', error);
      }

      // Obtener reportes de publicaciones (communities microservice)
      let publicationReports: any[] = [];
      try {
        const publicationReportsResponse = await firstValueFrom(
          this.client.send<any[]>('getActivePublicationReports', {}),
        );
        publicationReports = publicationReportsResponse || [];
      } catch (error) {
        console.error('Error fetching publication reports:', error);
      }

      // Obtener reportes de comentarios (communities microservice)
      let commentReports: any[] = [];
      try {
        const commentReportsResponse = await firstValueFrom(
          this.client.send<any[]>('getActiveCommentReports', {}),
        );
        commentReports = commentReportsResponse || [];
      } catch (error) {
        console.error('Error fetching comment reports:', error);
      }

      // Obtener reportes de reseñas de servicios (services microservice)
      let serviceReviewReports: any[] = [];
      try {
        const serviceReviewReportsResponse = await firstValueFrom(
          this.client.send<any[]>('getActiveServiceReviewReports', {}),
        );
        serviceReviewReports = serviceReviewReportsResponse || [];
      } catch (error) {
        console.error('Error fetching service review reports:', error);
      }

      // Consolidar todos los reportes
      const totalReports =
        userReviewReports.length +
        projectReports.length +
        serviceReports.length +
        publicationReports.length +
        commentReports.length +
        serviceReviewReports.length;

      // Por tipo
      const byType: ReportsByTypeDto[] = [
        {
          type: 'Reseñas de usuarios',
          count: userReviewReports.length,
        },
        {
          type: 'Proyectos',
          count: projectReports.length,
        },
        {
          type: 'Servicios',
          count: serviceReports.length,
        },
        {
          type: 'Publicaciones',
          count: publicationReports.length,
        },
        {
          type: 'Comentarios',
          count: commentReports.length,
        },
        {
          type: 'Reseñas de servicios',
          count: serviceReviewReports.length,
        },
      ].filter((item) => item.count > 0);

      // Por estado (todos los reportes actualmente están activos)
      const byStatus: ReportsByStatusDto[] = [
        {
          status: 'Activo',
          count: totalReports,
        },
      ];

      // Por motivo - consolidar motivos de todos los tipos
      const reasonsMap = new Map<string, number>();

      // Agregar motivos de user review reports
      userReviewReports.forEach((report) => {
        const reason = report.reason || 'Sin especificar';
        reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
      });

      // Agregar motivos de project reports
      projectReports.forEach((report: any) => {
        const reason = report.reason || 'Sin especificar';
        reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
      });

      // Agregar motivos de service reports
      serviceReports.forEach((report: any) => {
        const reason = report.reason || 'Sin especificar';
        reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
      });

      // Agregar motivos de publication reports
      publicationReports.forEach((report: any) => {
        const reason = report.reason || 'Sin especificar';
        reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
      });

      // Agregar motivos de comment reports
      commentReports.forEach((report: any) => {
        const reason = report.reason || 'Sin especificar';
        reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
      });

      // Agregar motivos de service review reports
      serviceReviewReports.forEach((report: any) => {
        const reason = report.reason || 'Sin especificar';
        reasonsMap.set(reason, (reasonsMap.get(reason) || 0) + 1);
      });

      const byReason: ReportsByReasonDto[] = Array.from(
        reasonsMap.entries(),
      ).map(([reason, count]) => ({
        reason,
        count,
      }));

      return {
        totalReports,
        byStatus,
        byType,
        byReason,
      };
    } catch (error) {
      console.error('Error getting admin report metrics:', error);
      return {
        totalReports: 0,
        byStatus: [],
        byType: [],
        byReason: [],
      };
    }
  }
}
