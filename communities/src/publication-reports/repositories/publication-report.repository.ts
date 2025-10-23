import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CreatePublicationReportDto } from '../dtos/create-publication-report.dto';
import { PublicationReport } from '../entities/publication-report.entity';
import { OrderByPublicationReport } from '../enums/orderby-publication-report.enum';

@Injectable()
export class PublicationReportRepository extends Repository<PublicationReport> {
  constructor(private dataSource: DataSource) {
    super(PublicationReport, dataSource.createEntityManager());
  }

  async createReport(
    createReportDto: CreatePublicationReportDto & { reporterId: number },
  ): Promise<PublicationReport> {
    const report = super.create(createReportDto);
    return await this.save(report);
  }

  async findByPublicationAndReporter(
    publicationId: number,
    reporterId: number,
  ): Promise<PublicationReport | null> {
    return await this.findOne({
      where: { publicationId, reporterId },
    });
  }

  async findReportsPaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<[PublicationReport[], number]> {
    const skip = (page - 1) * limit;

    const query = this.createQueryBuilder('report')
      .leftJoinAndSelect('report.publication', 'publication')
      .select([
        'report.id',
        'report.reason',
        'report.otherReason',
        'report.description',
        'report.createdAt',
        'report.publicationId',
        'report.reporterId',
        'publication.id',
        'publication.description',
        'publication.userId',
        'publication.isActive',
        'publication.deletedAt',
      ])
      .orderBy('report.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    return await query.getManyAndCount();
  }

  async getReportCountByPublication(publicationId: number): Promise<number> {
    return await this.count({ where: { publicationId } });
  }

  async getTotalReportCount(): Promise<number> {
    return await this.count();
  }

  async getPublicationIdsWithReports(): Promise<number[]> {
    const result = await this.createQueryBuilder('report')
      .select('DISTINCT report.publicationId', 'publicationId')
      .getRawMany();

    return result.map((row) => row.publicationId);
  }

  async findReportsByPublication(
    publicationId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<[PublicationReport[], number]> {
    const skip = (page - 1) * limit;

    const query = this.createQueryBuilder('report')
      .select([
        'report.id',
        'report.reason',
        'report.otherReason',
        'report.description',
        'report.createdAt',
        'report.publicationId',
        'report.reporterId',
      ])
      .where('report.publicationId = :publicationId', { publicationId })
      .orderBy('report.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    return await query.getManyAndCount();
  }

  async getPublicationsWithReportCounts(
    orderBy: OrderByPublicationReport,
    page: number = 1,
    limit: number = 10,
  ): Promise<[any[], number]> {
    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // Obtener todos los reportes con información básica de la publicación
    // Incluir reportes de publicaciones eliminadas
    const queryBuilder = this.createQueryBuilder('report')
      .leftJoinAndSelect('report.publication', 'publication')
      .select([
        'report.id',
        'report.publicationId',
        'report.reason',
        'report.description',
        'report.createdAt',
        'report.reporterId',
        'publication.description',
        'publication.isActive',
        'publication.deletedAt',
      ])
      .orderBy(
        'report.createdAt',
        orderBy === OrderByPublicationReport.LAST_REPORT_DATE ? 'DESC' : 'ASC',
      );

    // Aplicar paginación al nivel de reportes
    queryBuilder.skip(skip).take(limit);

    const [reports] = await queryBuilder.getManyAndCount();

    // Agrupar por publicación y contar reportes
    const publicationMap = new Map<
      number,
      {
        publicationId: number;
        publicationTitle: string;
        reportCount: number;
        lastReportDate: Date;
        isActive: boolean;
        deletedAt: Date | null;
        publication: any;
      }
    >();

    reports.forEach((report) => {
      // Verificar que la publicación existe y no está eliminada
      if (!report.publication) {
        return; // Saltar reportes de publicaciones eliminadas
      }

      const publicationId = report.publicationId;
      const publicationTitle = report.publication.description;
      const isActive = report.publication.isActive;
      const deletedAt = report.publication.deletedAt;

      if (!publicationMap.has(publicationId)) {
        publicationMap.set(publicationId, {
          publicationId,
          publicationTitle,
          reportCount: 0,
          lastReportDate: report.createdAt,
          isActive,
          deletedAt,
          publication: {
            id: publicationId,
            description: publicationTitle,
            userId: report.publication.userId,
            isActive,
            deletedAt,
          },
        });
      }

      const publicationData = publicationMap.get(publicationId);
      if (publicationData) {
        publicationData.reportCount++;

        if (report.createdAt > publicationData.lastReportDate) {
          publicationData.lastReportDate = report.createdAt;
        }
      }
    });

    // Convertir a array y ordenar
    const result = Array.from(publicationMap.values());

    if (orderBy === OrderByPublicationReport.LAST_REPORT_DATE) {
      result.sort(
        (a, b) =>
          new Date(b.lastReportDate).getTime() -
          new Date(a.lastReportDate).getTime(),
      );
    } else {
      result.sort((a, b) => b.reportCount - a.reportCount);
    }

    // Aplicar paginación al nivel de publicaciones agrupadas
    const totalUniquePublications = result.length;
    const paginatedResult = result.slice(skip, skip + limit);

    return [paginatedResult, totalUniquePublications];
  }

  /**
   * Encuentra reportes activos con su publicación asociada
   */
  async findActiveReportsWithPublications(): Promise<PublicationReport[]> {
    return this.find({
      where: { isActive: true },
      relations: ['publication'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Marca como inactivos reportes anteriores a una fecha
   */
  async softDeleteOldReports(oneYearAgo: Date) {
    const result = await this.createQueryBuilder()
      .update(PublicationReport)
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
      .update(PublicationReport)
      .set({ isActive: false })
      .where('id IN (:...reportIds)', { reportIds })
      .execute();
    return { affected: result.affected };
  }
}
