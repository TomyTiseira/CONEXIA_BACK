import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreateCommentReportDto } from '../dtos/create-comment-report.dto';
import { CommentReport } from '../entities/comment-report.entity';
import { OrderByCommentReport } from '../enums/orderby-comment-report.enum';

@Injectable()
export class CommentReportRepository extends Repository<CommentReport> {
  constructor(private dataSource: DataSource) {
    super(CommentReport, dataSource.createEntityManager());
  }

  async createReport(
    createReportDto: CreateCommentReportDto & { reporterId: number },
  ): Promise<CommentReport> {
    const report = super.create(createReportDto);
    return await this.save(report);
  }

  async findByCommentAndReporter(
    commentId: number,
    reporterId: number,
  ): Promise<CommentReport | null> {
    return await this.findOne({
      where: { commentId, reporterId },
    });
  }

  async findReportsPaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<[CommentReport[], number]> {
    const skip = (page - 1) * limit;

    const query = this.createQueryBuilder('report')
      .leftJoinAndSelect('report.comment', 'comment')
      .select([
        'report.id',
        'report.reason',
        'report.otherReason',
        'report.description',
        'report.createdAt',
        'report.commentId',
        'report.reporterId',
        'comment.id',
        'comment.content',
        'comment.userId',
        'comment.publicationId',
        'comment.isActive',
        'comment.deletedAt',
      ])
      .orderBy('report.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    return await query.getManyAndCount();
  }

  async getReportCountByComment(commentId: number): Promise<number> {
    return await this.count({ where: { commentId } });
  }

  async getTotalReportCount(): Promise<number> {
    return await this.count();
  }

  async getCommentIdsWithReports(): Promise<number[]> {
    const result = await this.createQueryBuilder('report')
      .select('DISTINCT report.commentId', 'commentId')
      .getRawMany();

    return result.map((row) => row.commentId);
  }

  async findReportsByComment(
    commentId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[CommentReport[], number]> {
    const skip = (page - 1) * limit;

    const query = this.createQueryBuilder('report')
      .leftJoinAndSelect('report.comment', 'comment')
      .select([
        'report.id',
        'report.reason',
        'report.otherReason',
        'report.description',
        'report.createdAt',
        'report.commentId',
        'report.reporterId',
        'comment.id',
        'comment.content',
        'comment.userId',
        'comment.publicationId',
        'comment.isActive',
        'comment.createdAt',
      ])
      .where('report.commentId = :commentId', { commentId })
      .orderBy('report.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    return await query.getManyAndCount();
  }

  async getCommentsWithReportCounts(
    orderBy: OrderByCommentReport,
    page: number = 1,
    limit: number = 10,
  ): Promise<[any[], number]> {
    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // Obtener todos los reportes con información básica del comentario
    const queryBuilder = this.createQueryBuilder('report')
      .leftJoinAndSelect('report.comment', 'comment')
      .select([
        'report.id',
        'report.commentId',
        'report.reason',
        'report.description',
        'report.createdAt',
        'report.reporterId',
        'comment.content',
        'comment.userId',
        'comment.publicationId',
        'comment.isActive',
        'comment.deletedAt',
      ])
      .orderBy(
        'report.createdAt',
        orderBy === OrderByCommentReport.LAST_REPORT_DATE ? 'DESC' : 'ASC',
      );

    // Aplicar paginación al nivel de reportes
    queryBuilder.skip(skip).take(limit);

    const [reports] = await queryBuilder.getManyAndCount();

    // Agrupar por comentario y contar reportes
    const commentMap = new Map<
      number,
      {
        commentId: number;
        commentContent: string;
        reportCount: number;
        lastReportDate: Date;
        isActive: boolean;
        deletedAt: Date | null;
        comment: any;
      }
    >();

    reports.forEach((report) => {
      // Verificar que el comentario existe
      if (!report.comment) {
        return; // Saltar reportes de comentarios eliminados
      }

      const commentId = report.commentId;
      const commentContent = report.comment.content;
      const isActive = report.comment.isActive;
      const deletedAt = report.comment.deletedAt;

      if (!commentMap.has(commentId)) {
        commentMap.set(commentId, {
          commentId,
          commentContent,
          reportCount: 0,
          lastReportDate: report.createdAt,
          isActive,
          deletedAt,
          comment: {
            id: commentId,
            content: commentContent,
            userId: report.comment.userId,
            publicationId: report.comment.publicationId,
            isActive,
            deletedAt,
          },
        });
      }

      const commentData = commentMap.get(commentId);
      if (commentData) {
        commentData.reportCount++;

        if (report.createdAt > commentData.lastReportDate) {
          commentData.lastReportDate = report.createdAt;
        }
      }
    });

    // Convertir a array y ordenar
    const result = Array.from(commentMap.values());

    if (orderBy === OrderByCommentReport.LAST_REPORT_DATE) {
      result.sort(
        (a, b) =>
          new Date(b.lastReportDate).getTime() -
          new Date(a.lastReportDate).getTime(),
      );
    } else {
      result.sort((a, b) => b.reportCount - a.reportCount);
    }

    // Aplicar paginación al nivel de comentarios agrupados
    const totalUniqueComments = result.length;
    const paginatedResult = result.slice(skip, skip + limit);

    return [paginatedResult, totalUniqueComments];
  }

  /**
   * Encuentra reportes activos con su comentario asociado
   */
  async findActiveReportsWithComments(): Promise<CommentReport[]> {
    return this.find({
      where: { isActive: true },
      relations: ['comment'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Marca como inactivos reportes anteriores a una fecha
   */
  async softDeleteOldReports(oneYearAgo: Date) {
    const result = await this.createQueryBuilder()
      .update(CommentReport)
      .set({ isActive: false })
      .where('createdAt < :oneYearAgo', { oneYearAgo })
      .andWhere('isActive = :isActive', { isActive: true })
      .execute();
    return { affected: result.affected };
  }

  /**
   * Desactiva reportes específicos por ID
   */
  async deactivateReports(reportIds: number[]) {
    const result = await this.createQueryBuilder()
      .update(CommentReport)
      .set({ isActive: false })
      .where('id IN (:...reportIds)', { reportIds })
      .execute();
    return { affected: result.affected };
  }
}
