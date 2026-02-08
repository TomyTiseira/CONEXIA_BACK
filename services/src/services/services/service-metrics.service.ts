import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceHiring } from '../../service-hirings/entities/service-hiring.entity';
import { ServiceHiringStatusCode } from '../../service-hirings/enums/service-hiring-status.enum';
import { ServiceReview } from '../../service-reviews/entities/service-review.entity';
import {
  ServiceMetricsDto,
  ServiceMetricsResponseDto,
} from '../dto/service-metrics.dto';
import { Service } from '../entities/service.entity';

@Injectable()
export class ServiceMetricsService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(ServiceHiring)
    private readonly hiringRepository: Repository<ServiceHiring>,
    @InjectRepository(ServiceReview)
    private readonly reviewRepository: Repository<ServiceReview>,
  ) {}

  /**
   * Obtiene las métricas de servicios según el plan del usuario
   */
  async getServiceMetrics(
    dto: ServiceMetricsDto,
  ): Promise<ServiceMetricsResponseDto> {
    const { userId, userPlan } = dto;

    // Obtener todos los servicios publicados por el usuario (incluyendo eliminados soft delete)
    const publishedServices = await this.serviceRepository
      .createQueryBuilder('service')
      .where('service.userId = :userId', { userId })
      .withDeleted() // Incluir servicios eliminados con soft delete
      .getMany();

    const totalServicesPublished = publishedServices.length;
    const publishedServiceIds = publishedServices.map((s) => s.id);

    // Si no tiene servicios publicados, retornar métricas vacías
    if (publishedServiceIds.length === 0) {
      return this.getEmptyMetrics(userPlan);
    }

    // Obtener todas las contrataciones de los servicios del usuario
    const hirings = await this.hiringRepository
      .createQueryBuilder('hiring')
      .leftJoinAndSelect('hiring.status', 'status')
      .leftJoinAndSelect('hiring.service', 'service')
      .where('hiring.serviceId IN (:...serviceIds)', {
        serviceIds: publishedServiceIds,
      })
      .getMany();

    // Métricas base (FREE)
    const totalServicesHired = this.countUniqueHiredServices(hirings);
    const hiringPercentage =
      totalServicesPublished > 0
        ? (totalServicesHired / totalServicesPublished) * 100
        : 0;

    // Obtener calificaciones promedio
    const reviews = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.serviceOwnerUserId = :userId', { userId })
      .andWhere('review.deletedAt IS NULL')
      .getMany();

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    // Construir respuesta base
    const baseMetrics: ServiceMetricsResponseDto = {
      totalServicesHired,
      totalServicesPublished,
      hiringPercentage: Math.round(hiringPercentage * 10) / 10,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      userPlan,
      lastUpdated: new Date(),
    };

    // Si es plan FREE, solo retornar métricas base
    if (userPlan === 'Free') {
      return baseMetrics;
    }

    // Métricas adicionales para BASIC y PREMIUM
    const totalRevenueGenerated = this.calculateRevenue(hirings);
    const serviceRevenueBreakdown = this.calculateRevenueByService(
      hirings,
      publishedServices,
    );

    // Si es plan BASIC
    if (userPlan === 'Basic') {
      return {
        ...baseMetrics,
        totalRevenueGenerated,
        serviceRevenueBreakdown,
      };
    }

    // Métricas adicionales para PREMIUM
    const { completed, cancelled, withClaims } =
      this.categorizeHirings(hirings);
    const topHiredServices = await this.getTopHiredServices(
      userId,
      publishedServiceIds,
    );

    return {
      ...baseMetrics,
      totalRevenueGenerated,
      serviceRevenueBreakdown,
      servicesCompleted: completed,
      servicesCancelled: cancelled,
      servicesWithClaims: withClaims,
      topHiredServices,
    };
  }

  /**
   * Cuenta servicios únicos que fueron contratados al menos una vez
   */
  private countUniqueHiredServices(hirings: ServiceHiring[]): number {
    const uniqueServiceIds = new Set(
      hirings.map((h) => h.serviceId).filter((id) => id != null),
    );
    return uniqueServiceIds.size;
  }

  /**
   * Calcula los ingresos totales de servicios completados
   * Solo cuenta servicios en estado COMPLETED (sin reclamos)
   */
  private calculateRevenue(hirings: ServiceHiring[]): number {
    return hirings
      .filter((h) => h.status?.code === ServiceHiringStatusCode.COMPLETED)
      .reduce((sum, h) => {
        // El monto es el quotedPrice del hiring
        const amount = h.quotedPrice || 0;
        return sum + Number(amount);
      }, 0);
  }

  /**
   * Calcula los ingresos desglosados por cada servicio
   * Solo cuenta servicios en estado COMPLETED (sin reclamos)
   * Cada hiring (solicitud) se cuenta una sola vez, independiente de cuántos entregables tenga
   */
  private calculateRevenueByService(
    hirings: ServiceHiring[],
    publishedServices: Service[],
  ): Array<{
    serviceId: number;
    serviceTitle: string;
    totalRevenue: number;
    timesCompleted: number;
  }> {
    // Filtrar solo hirings completados
    const completedHirings = hirings.filter(
      (h) => h.status?.code === ServiceHiringStatusCode.COMPLETED,
    );

    // Deduplicar por hiring ID para evitar contar el mismo hiring múltiples veces
    // (en caso de que haya duplicados por joins o deliveries)
    const uniqueHiringsMap = new Map<number, ServiceHiring>();
    completedHirings.forEach((hiring) => {
      if (!uniqueHiringsMap.has(hiring.id)) {
        uniqueHiringsMap.set(hiring.id, hiring);
      }
    });

    // Agrupar contrataciones únicas por servicio
    const revenueMap = new Map<
      number,
      { revenue: number; count: number; title: string }
    >();

    Array.from(uniqueHiringsMap.values()).forEach((hiring) => {
      const serviceId = hiring.serviceId;
      const revenue = Number(hiring.quotedPrice || 0);
      const service = publishedServices.find((s) => s.id === serviceId);

      if (revenueMap.has(serviceId)) {
        const current = revenueMap.get(serviceId)!;
        revenueMap.set(serviceId, {
          revenue: current.revenue + revenue,
          count: current.count + 1,
          title: current.title,
        });
      } else {
        revenueMap.set(serviceId, {
          revenue,
          count: 1,
          title: service?.title || 'Servicio eliminado',
        });
      }
    });

    // Convertir a array y ordenar por ingresos descendente
    return Array.from(revenueMap.entries())
      .map(([serviceId, data]) => ({
        serviceId,
        serviceTitle: data.title,
        totalRevenue: data.revenue,
        timesCompleted: data.count,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  /*
   * COMPLETADOS: solo completed (sin reclamos)
   * CANCELADOS: cancelled, cancelled_by_claim, rejected
   * CON RECLAMOS: completed_by_claim, completed_with_agreement, cancelled_by_claim
   */
  private categorizeHirings(hirings: ServiceHiring[]): {
    completed: number;
    cancelled: number;
    withClaims: number;
  } {
    const cancelledStatuses = [
      ServiceHiringStatusCode.CANCELLED,
      ServiceHiringStatusCode.CANCELLED_BY_CLAIM,
      ServiceHiringStatusCode.REJECTED,
    ];

    // Estados que indican que hubo un reclamo en algún momento
    const claimStatuses = [
      ServiceHiringStatusCode.COMPLETED_BY_CLAIM, // Completado pero tuvo reclamo
      ServiceHiringStatusCode.COMPLETED_WITH_AGREEMENT, // Acuerdo parcial (también tuvo reclamo)
      ServiceHiringStatusCode.CANCELLED_BY_CLAIM, // Cancelado por reclamo
    ];

    // Solo contar COMPLETED (sin reclamos)
    const completed = hirings.filter(
      (h) => h.status?.code === ServiceHiringStatusCode.COMPLETED,
    ).length;

    const cancelled = hirings.filter((h) =>
      cancelledStatuses.includes(h.status?.code),
    ).length;

    // Servicios que tuvieron reclamos (independiente de si se completaron o cancelaron)
    const withClaims = hirings.filter((h) =>
      claimStatuses.includes(h.status?.code),
    ).length;

    return {
      completed,
      cancelled,
      withClaims,
    };
  }

  /**
   * Obtiene los top 5 servicios más contratados con sus estadísticas
   * Ordena por cantidad de veces contratado (timesHired)
   */
  private async getTopHiredServices(
    userId: number,
    serviceIds: number[],
  ): Promise<
    Array<{
      serviceId: number;
      serviceTitle: string;
      timesHired: number;
      revenue: number;
      averageRating: number;
    }>
  > {
    if (serviceIds.length === 0) return [];

    // Obtener estadísticas por servicio
    const stats = await this.hiringRepository
      .createQueryBuilder('hiring')
      .select('hiring.serviceId', 'serviceId')
      .addSelect('COUNT(hiring.id)', 'timesHired')
      .addSelect(
        `SUM(CASE 
          WHEN status.code = 'completed' 
          THEN COALESCE(hiring.quotedPrice, 0) 
          ELSE 0 
        END)`,
        'revenue',
      )
      .leftJoin('hiring.status', 'status')
      .where('hiring.serviceId IN (:...serviceIds)', { serviceIds })
      .groupBy('hiring.serviceId')
      .orderBy('COUNT(hiring.id)', 'DESC')
      .limit(5)
      .getRawMany();

    // Obtener información adicional de los servicios y reviews
    const topServices = await Promise.all(
      stats.map(async (stat) => {
        const service = await this.serviceRepository.findOne({
          where: { id: stat.serviceId },
          withDeleted: true,
        });

        // Solo contar reviews no eliminadas
        const reviews = await this.reviewRepository.find({
          where: { serviceId: stat.serviceId },
        });

        const averageRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return {
          serviceId: stat.serviceId,
          serviceTitle: service?.title || 'Servicio eliminado',
          timesHired: parseInt(stat.timesHired),
          revenue: parseFloat(stat.revenue) || 0,
          averageRating: Math.round(averageRating * 10) / 10,
        };
      }),
    );

    return topServices;
  }

  /**
   * Retorna métricas vacías para usuarios sin servicios
   */
  private getEmptyMetrics(
    userPlan: 'Free' | 'Basic' | 'Premium',
  ): ServiceMetricsResponseDto {
    const base: ServiceMetricsResponseDto = {
      totalServicesHired: 0,
      totalServicesPublished: 0,
      hiringPercentage: 0,
      averageRating: 0,
      totalReviews: 0,
      userPlan,
      lastUpdated: new Date(),
    };

    if (userPlan === 'Basic') {
      return {
        ...base,
        totalRevenueGenerated: 0,
        serviceRevenueBreakdown: [],
      };
    }

    if (userPlan === 'Premium') {
      return {
        ...base,
        totalRevenueGenerated: 0,
        serviceRevenueBreakdown: [],
        servicesCompleted: 0,
        servicesCancelled: 0,
        servicesWithClaims: 0,
        topHiredServices: [],
      };
    }

    return base;
  }

  /**
   * Exporta las métricas en formato CSV con mejor estructura visual
   */
  async exportMetricsToCSV(dto: ServiceMetricsDto): Promise<string> {
    const metrics = await this.getServiceMetrics(dto);

    // Configurar encoding UTF-8 con BOM para Excel
    let csv = '\uFEFF'; // BOM para UTF-8

    // ========================================
    // SECCIÓN 1: RESUMEN GENERAL
    // ========================================
    csv += '=== RESUMEN GENERAL DE SERVICIOS ===\n';
    csv += `Plan del Usuario:,${metrics.userPlan}\n`;
    csv += `Fecha de Generación:,${new Date(metrics.lastUpdated).toLocaleString('es-AR')}\n`;
    csv += '\n';

    // Métricas base (FREE)
    csv += '=== MÉTRICAS BÁSICAS ===\n';
    csv += 'Métrica,Valor\n';
    csv += `Total de Servicios Publicados,${metrics.totalServicesPublished}\n`;
    csv += `Servicios Contratados (únicos),${metrics.totalServicesHired}\n`;
    csv += `Porcentaje de Contratación,${metrics.hiringPercentage}%\n`;
    csv += `Calificación Promedio,${metrics.averageRating} / 5.0\n`;
    csv += `Total de Reseñas Recibidas,${metrics.totalReviews}\n`;
    csv += '\n';

    // Métricas BASIC y PREMIUM - Ingresos
    if (metrics.totalRevenueGenerated !== undefined) {
      csv += '=== INGRESOS GENERADOS ===\n';
      csv += `Total de Ingresos (ARS):,"$ ${metrics.totalRevenueGenerated.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"\n`;
      csv += '\n';

      // Desglose por servicio
      if (
        metrics.serviceRevenueBreakdown &&
        metrics.serviceRevenueBreakdown.length > 0
      ) {
        csv += '=== INGRESOS POR SERVICIO ===\n';
        csv +=
          'Servicio,Ingresos Generados (ARS),Veces Completado,Promedio por Completación\n';
        metrics.serviceRevenueBreakdown.forEach((service) => {
          const avgRevenue =
            service.timesCompleted > 0
              ? service.totalRevenue / service.timesCompleted
              : 0;
          csv += `"${service.serviceTitle}","$ ${service.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}",${service.timesCompleted},"$ ${avgRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}"\n`;
        });
        csv += '\n';
      }
    }

    // Métricas PREMIUM - Estadísticas avanzadas
    if (metrics.servicesCompleted !== undefined) {
      csv += '=== ESTADÍSTICAS DE CONTRATACIONES ===\n';
      csv += 'Métrica,Cantidad\n';
      csv += `Servicios Completados,${metrics.servicesCompleted}\n`;
      csv += `Servicios Cancelados,${metrics.servicesCancelled}\n`;
      csv += `Servicios con Reclamos,${metrics.servicesWithClaims}\n`;
      csv += '\n';
    }

    // Top servicios (solo PREMIUM)
    if (metrics.topHiredServices && metrics.topHiredServices.length > 0) {
      csv += '=== TOP 5 SERVICIOS MÁS CONTRATADOS ===\n';
      csv +=
        'Posición,Servicio,Veces Contratado,Ingresos Generados (ARS),Calificación Promedio\n';
      metrics.topHiredServices.forEach((service, index) => {
        csv += `#${index + 1},"${service.serviceTitle}",${service.timesHired},"$ ${service.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}",${service.averageRating} / 5.0\n`;
      });
      csv += '\n';
    }

    // Footer
    csv += '=== FIN DEL REPORTE ===\n';
    csv += `Generado por CONEXIA - ${new Date().toLocaleString('es-AR')}\n`;

    return csv;
  }
}
