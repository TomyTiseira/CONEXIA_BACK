import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserReviewReport } from '../entities/user-review-report.entity';
import { OrderByUserReviewReport } from '../enums/orderby-user-review-report.enum';

@Injectable()
export class UserReviewReportRepository {
  constructor(
    @InjectRepository(UserReviewReport)
    private readonly repository: Repository<UserReviewReport>,
  ) {}

  async create(report: Partial<UserReviewReport>): Promise<UserReviewReport> {
    const newReport = this.repository.create(report);
    return this.repository.save(newReport);
  }

  async findByUserReviewAndReporter(
    userReviewId: number,
    reporterId: number,
  ): Promise<UserReviewReport | null> {
    const result = await this.repository.findOne({
      where: { userReviewId, reporterId },
    });
    return result;
  }

  async findByUserReview(userReviewId: number): Promise<UserReviewReport[]> {
    return this.repository.find({
      where: { userReviewId },
      order: { createdAt: 'DESC' },
    });
  }

  async findReportsByUserReview(
    userReviewId: number,
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
        'report.userReviewId',
        'report.reporterId',
      ])
      .where('report.userReviewId = :userReviewId', { userReviewId })
      .orderBy('report.createdAt', 'DESC');

    // Aplicar paginación
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const data = await query.getMany();
    const total = await this.repository.count({ where: { userReviewId } });

    return [data, total];
  }

  async getUserReviewsWithReportCounts(
    orderBy: OrderByUserReviewReport,
    page: number = 1,
    limit: number = 10,
  ): Promise<[any[], number]> {
    // Obtener todos los reportes con información básica de la reseña
    const queryBuilder = this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.userReview', 'userReview')
      .select([
        'report.id',
        'report.userReviewId',
        'report.reason',
        'report.description',
        'report.createdAt',
        'report.reporterId',
        'userReview.reviewedUserId',
        'userReview.reviewerUserId',
        'userReview.relationship',
        'userReview.description',
        'userReview.createdAt',
      ])
      .orderBy(
        'report.createdAt',
        orderBy === OrderByUserReviewReport.LAST_REPORT_DATE ? 'DESC' : 'ASC',
      );

    const reports = await queryBuilder.getMany();

    // Agrupar por reseña y contar reportes
    const userReviewMap = new Map<
      number,
      {
        userReviewId: number;
        reviewedUserId: number;
        reviewerUserId: number;
        relationship: string;
        description: string;
        reportCount: number;
        lastReportDate: Date;
        reviewCreatedAt: Date;
      }
    >();

    reports.forEach((report) => {
      // Validar que la reseña existe
      if (!report.userReview) {
        return;
      }

      const userReviewId = report.userReviewId;
      const reviewedUserId = report.userReview.reviewedUserId;
      const reviewerUserId = report.userReview.reviewerUserId;
      const relationship = report.userReview.relationship;
      const description = report.userReview.description;
      const reviewCreatedAt = report.userReview.createdAt;

      if (!userReviewMap.has(userReviewId)) {
        userReviewMap.set(userReviewId, {
          userReviewId,
          reviewedUserId,
          reviewerUserId,
          relationship,
          description,
          reportCount: 0,
          lastReportDate: report.createdAt,
          reviewCreatedAt,
        });
      }

      const reviewData = userReviewMap.get(userReviewId);
      if (reviewData) {
        reviewData.reportCount++;

        if (report.createdAt > reviewData.lastReportDate) {
          reviewData.lastReportDate = report.createdAt;
        }
      }
    });

    // Convertir a array y ordenar
    const allUserReviews = Array.from(userReviewMap.values());

    if (orderBy === OrderByUserReviewReport.LAST_REPORT_DATE) {
      allUserReviews.sort(
        (a, b) =>
          new Date(b.lastReportDate).getTime() -
          new Date(a.lastReportDate).getTime(),
      );
    } else {
      allUserReviews.sort((a, b) => b.reportCount - a.reportCount);
    }

    // Aplicar paginación al nivel de reseñas únicas
    const skip = (page - 1) * limit;
    const paginatedUserReviews = allUserReviews.slice(skip, skip + limit);
    const totalUniqueUserReviews = allUserReviews.length;

    return [paginatedUserReviews, totalUniqueUserReviews];
  }

  async getReportCountByUserReview(userReviewId: number): Promise<number> {
    return this.repository.count({
      where: { userReviewId },
    });
  }

  async findActiveReportsWithUserReviews(): Promise<UserReviewReport[]> {
    return this.repository.find({
      where: { isActive: true },
      relations: ['userReview'],
      order: { createdAt: 'DESC' },
    });
  }

  async softDeleteOldReports(oneYearAgo: Date) {
    const result = await this.repository
      .createQueryBuilder()
      .update(UserReviewReport)
      .set({ isActive: false })
      .where('createdAt < :oneYearAgo', { oneYearAgo })
      .andWhere('isActive = :isActive', { isActive: true })
      .execute();
    return { affected: result.affected };
  }

  async getUserReviewIdsWithReports(): Promise<number[]> {
    const results = await this.repository
      .createQueryBuilder('report')
      .select('DISTINCT report.userReviewId', 'userReviewId')
      .getRawMany();

    return results.map((result) => result.userReviewId);
  }

  async getTotalReportCount(): Promise<number> {
    return this.repository.count();
  }

  /**
   * Desactiva reportes específicos por ID
   */
  async deactivateReports(reportIds: number[]) {
    const result = await this.repository
      .createQueryBuilder()
      .update(UserReviewReport)
      .set({ isActive: false })
      .where('id IN (:...reportIds)', { reportIds })
      .execute();
    return { affected: result.affected };
  }
}
