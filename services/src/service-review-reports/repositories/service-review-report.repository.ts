import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceReviewReport } from '../entities/service-review-report.entity';

@Injectable()
export class ServiceReviewReportRepository {
  constructor(
    @InjectRepository(ServiceReviewReport)
    private readonly repository: Repository<ServiceReviewReport>,
  ) {}

  /**
   * Crear un nuevo reporte de reseña
   */
  async create(
    reportData: Partial<ServiceReviewReport>,
  ): Promise<ServiceReviewReport> {
    const report = this.repository.create(reportData);
    return await this.repository.save(report);
  }

  /**
   * Buscar reporte por reseña y reporter
   */
  async findByServiceReviewAndReporter(
    serviceReviewId: number,
    reporterId: number,
  ): Promise<ServiceReviewReport | null> {
    return await this.repository.findOne({
      where: {
        serviceReviewId,
        reporterId,
        isActive: true,
      },
    });
  }

  /**
   * Obtener todos los reportes de una reseña específica
   */
  async findByServiceReviewId(
    serviceReviewId: number,
  ): Promise<ServiceReviewReport[]> {
    return await this.repository.find({
      where: {
        serviceReviewId,
        isActive: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Contar reportes activos de una reseña
   */
  async countActiveReportsByServiceReview(
    serviceReviewId: number,
  ): Promise<number> {
    return await this.repository.count({
      where: {
        serviceReviewId,
        isActive: true,
      },
    });
  }

  /**
   * Obtener reseñas con reportes (para moderadores)
   */
  async findServiceReviewsWithReports(
    page: number,
    limit: number,
  ): Promise<[ServiceReviewReport[], number]> {
    const query = this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.serviceReview', 'serviceReview')
      .where('report.isActive = :isActive', { isActive: true })
      .orderBy('report.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    return await query.getManyAndCount();
  }

  /**
   * Obtener reportes de una reseña con paginación (para moderadores)
   */
  async findReportsByServiceReview(
    serviceReviewId: number,
    page: number,
    limit: number,
  ): Promise<[ServiceReviewReport[], number]> {
    return await this.repository.findAndCount({
      where: {
        serviceReviewId,
        isActive: true,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  /**
   * Obtener reseñas con conteo de reportes (para moderadores)
   */
  async getServiceReviewsWithReportCounts(params: {
    orderBy: string;
    page: number;
    limit: number;
  }): Promise<[any[], number]> {
    const { orderBy, page, limit } = params;

    // Obtener todos los reportes activos con información de la reseña
    const queryBuilder = this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.serviceReview', 'serviceReview')
      .where('report.isActive = :isActive', { isActive: true })
      .orderBy('report.createdAt', 'DESC');

    const reports = await queryBuilder.getMany();

    // Agrupar por reseña y contar reportes
    const serviceReviewMap = new Map<
      number,
      {
        serviceReviewId: number;
        serviceId: number;
        reviewerUserId: number;
        serviceOwnerUserId: number;
        rating: number;
        comment: string;
        reportCount: number;
        lastReportDate: Date;
        reviewCreatedAt: Date;
      }
    >();

    reports.forEach((report) => {
      if (!report.serviceReview) {
        return;
      }

      const serviceReviewId = report.serviceReviewId;
      const serviceReview = report.serviceReview;

      if (!serviceReviewMap.has(serviceReviewId)) {
        serviceReviewMap.set(serviceReviewId, {
          serviceReviewId,
          serviceId: serviceReview.serviceId,
          reviewerUserId: serviceReview.reviewerUserId,
          serviceOwnerUserId: serviceReview.serviceOwnerUserId,
          rating: serviceReview.rating,
          comment: serviceReview.comment,
          reportCount: 0,
          lastReportDate: report.createdAt,
          reviewCreatedAt: serviceReview.createdAt,
        });
      }

      const reviewData = serviceReviewMap.get(serviceReviewId);
      if (reviewData) {
        reviewData.reportCount++;

        if (report.createdAt > reviewData.lastReportDate) {
          reviewData.lastReportDate = report.createdAt;
        }
      }
    });

    // Convertir a array y ordenar
    const allServiceReviews = Array.from(serviceReviewMap.values());

    if (orderBy === 'lastReportDate') {
      allServiceReviews.sort(
        (a, b) =>
          new Date(b.lastReportDate).getTime() -
          new Date(a.lastReportDate).getTime(),
      );
    } else {
      // orderBy === 'reportCount'
      allServiceReviews.sort((a, b) => b.reportCount - a.reportCount);
    }

    // Aplicar paginación
    const total = allServiceReviews.length;
    const skip = (page - 1) * limit;
    const paginatedReviews = allServiceReviews.slice(skip, skip + limit);

    return [paginatedReviews, total];
  }
}
