import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderByServiceReport } from '../dtos/get-service-reports-list.dto';
import { ServiceReport } from '../entities/service-report.entity';

@Injectable()
export class ServiceReportRepository {
  constructor(
    @InjectRepository(ServiceReport)
    private readonly repository: Repository<ServiceReport>,
  ) {}

  async create(report: Partial<ServiceReport>): Promise<ServiceReport> {
    const newReport = this.repository.create(report);
    return this.repository.save(newReport);
  }

  async findByServiceAndReporter(
    serviceId: number,
    reporterId: number,
  ): Promise<ServiceReport | null> {
    return this.repository.findOne({
      where: { serviceId, reporterId },
    });
  }

  async findByService(serviceId: number): Promise<ServiceReport[]> {
    return this.repository.find({
      where: { serviceId },
      order: { createdAt: 'DESC' },
    });
  }

  async findReportsByService(
    serviceId: number,
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
        'report.serviceId',
        'report.reporterId',
      ])
      .where('report.serviceId = :serviceId', { serviceId })
      .orderBy('report.createdAt', 'DESC');

    // Aplicar paginación
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const data = await query.getMany();
    const total = await this.repository.count({ where: { serviceId } });

    return [data, total];
  }

  async getServicesWithReportCounts(
    orderBy: OrderByServiceReport,
    page: number = 1,
    limit: number = 10,
  ): Promise<[any[], number]> {
    // Calcular skip para paginación
    const skip = (page - 1) * limit;

    // Obtener todos los reportes con información básica del servicio
    // NO incluir reportes de servicios eliminados
    const queryBuilder = this.repository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.service', 'service')
      .select([
        'report.id',
        'report.serviceId',
        'report.reason',
        'report.description',
        'report.createdAt',
        'report.reporterId',
        'service.title',
        'service.status',
        'service.deletedAt',
      ])
      .where('service.deletedAt IS NULL')
      .orderBy(
        'report.createdAt',
        orderBy === OrderByServiceReport.LAST_REPORT_DATE ? 'DESC' : 'ASC',
      );

    // Aplicar paginación
    queryBuilder.skip(skip).take(limit);

    const [reports, total] = await queryBuilder.getManyAndCount();

    // Agrupar por servicio y contar reportes
    const serviceMap = new Map<
      number,
      {
        serviceId: number;
        serviceTitle: string;
        reportCount: number;
        lastReportDate: Date;
        status: string;
        deletedAt: Date | null;
      }
    >();

    reports.forEach((report) => {
      // Validar que el servicio existe (protección contra null)
      if (!report.service) {
        return; // Skip este reporte si no tiene servicio
      }

      const serviceId = report.serviceId;
      const serviceTitle = report.service.title;
      const status = report.service.status;
      const deletedAt = report.service.deletedAt;

      if (!serviceMap.has(serviceId)) {
        serviceMap.set(serviceId, {
          serviceId,
          serviceTitle,
          reportCount: 0,
          lastReportDate: report.createdAt,
          status,
          deletedAt,
        });
      }

      const serviceData = serviceMap.get(serviceId);
      if (serviceData) {
        serviceData.reportCount++;

        if (report.createdAt > serviceData.lastReportDate) {
          serviceData.lastReportDate = report.createdAt;
        }
      }
    });

    // Convertir a array y ordenar
    const result = Array.from(serviceMap.values());

    if (orderBy === OrderByServiceReport.LAST_REPORT_DATE) {
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

  async getReportCountByService(serviceId: number): Promise<number> {
    return this.repository.count({
      where: { serviceId },
    });
  }

  async deleteByService(serviceId: number): Promise<void> {
    await this.repository.delete({ serviceId });
  }

  async getServiceIdsWithReports(): Promise<number[]> {
    const results = await this.repository
      .createQueryBuilder('report')
      .select('DISTINCT report.serviceId', 'serviceId')
      .getRawMany();

    return results.map((result) => result.serviceId);
  }

  async getTotalReportCount(): Promise<number> {
    return this.repository.count();
  }

  async findActiveReportsWithServices(): Promise<ServiceReport[]> {
    return this.repository.find({
      where: { isActive: true },
      relations: ['service'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Marca como inactivos reportes anteriores a una fecha
   */
  async softDeleteOldReports(oneYearAgo: Date) {
    const result = await this.repository
      .createQueryBuilder()
      .update(ServiceReport)
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
    const result = await this.repository
      .createQueryBuilder()
      .update(ServiceReport)
      .set({ isActive: false })
      .where('id IN (:...reportIds)', { reportIds })
      .execute();
    return { affected: result.affected };
  }
}
