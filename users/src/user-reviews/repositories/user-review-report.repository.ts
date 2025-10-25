import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderByUserReviewReport } from '../dtos/get-user-review-reports-list.dto';
import { UserReviewReport } from '../entities/user-review-report.entity';

@Injectable()
export class UserReviewReportRepository {
  constructor(
    @InjectRepository(UserReviewReport)
    private readonly repository: Repository<UserReviewReport>,
  ) {}

  async create(
    report: Partial<UserReviewReport>,
  ): Promise<UserReviewReport> {
    const newReport = this.repository.create(report);
    return this.repository.save(newReport);
  }

  async findByUserReviewAndReporter(
    userReviewId: number,
    reporterId: number,
  ): Promise<UserReviewReport | null> {
    return this.repository.findOne({
      where: { userReviewId, reporterId },
    });
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
    // Calcular skip para paginación
    const skip = (page - 1) * limit;

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

    // Aplicar paginación
    queryBuilder.skip(skip).take(limit);

    const [reports, total] = await queryBuilder.getManyAndCount();

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
    const result = Array.from(userReviewMap.values());

    if (orderBy === OrderByUserReviewReport.LAST_REPORT_DATE) {
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
