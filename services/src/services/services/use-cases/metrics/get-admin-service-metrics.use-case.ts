import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Claim } from '../../../../service-hirings/entities/claim.entity';
import { ServiceHiring } from '../../../../service-hirings/entities/service-hiring.entity';
import { ServiceHiringStatusCode } from '../../../../service-hirings/enums/service-hiring-status.enum';
import { ServiceHiringRepository } from '../../../../service-hirings/repositories/service-hiring.repository';
import { AdminServiceMetricsDto } from '../../../dto/service-metrics.dto';

@Injectable()
export class GetAdminServiceMetricsUseCase {
  constructor(
    private readonly serviceHiringRepository: ServiceHiringRepository,
    @InjectRepository(ServiceHiring)
    private readonly serviceHiringRepo: Repository<ServiceHiring>,
    @InjectRepository(Claim)
    private readonly claimRepository: Repository<Claim>,
  ) {}

  async execute(): Promise<AdminServiceMetricsDto> {
    try {
      // 1. SERVICIOS COMPLETADOS (solo estado COMPLETED)
      const totalServicesHired =
        await this.serviceHiringRepository.getTotalCompletedHirings();

      // 2. INGRESOS TOTALES (solo de servicios COMPLETED)
      const totalRevenue = await this.serviceHiringRepository.getTotalRevenue();

      // 3. SERVICIOS COMPLETADOS POR TIPO (solo COMPLETED)
      const byType =
        await this.serviceHiringRepository.getServiceHiringsByType();

      // 4. COTIZACIONES
      // Total de solicitudes (INCLUYE todas, incluso canceladas y rechazadas)
      const sentQuotations = await this.serviceHiringRepo.count();

      // Obtener IDs de estados cancelado y rechazado
      const cancelledStatusId = await this.getStatusId(
        ServiceHiringStatusCode.CANCELLED,
      );
      const rejectedStatusId = await this.getStatusId(
        ServiceHiringStatusCode.REJECTED,
      );

      // Solicitudes canceladas o rechazadas
      const cancelledOrRejected = await this.serviceHiringRepo.count({
        where: [
          { statusId: cancelledStatusId },
          { statusId: rejectedStatusId },
        ],
      });

      // Cotizaciones aceptadas = Total - (canceladas + rechazadas)
      const acceptedQuotations = sentQuotations - cancelledOrRejected;

      const quotationAcceptanceRate =
        sentQuotations > 0 ? (acceptedQuotations / sentQuotations) * 100 : 0;

      // 5. TASA DE RECLAMOS
      // Servicios en progreso (SIN incluir IN_CLAIM)
      const inProgressStatuses = [
        ServiceHiringStatusCode.ACCEPTED,
        ServiceHiringStatusCode.IN_PROGRESS,
        ServiceHiringStatusCode.APPROVED,
        ServiceHiringStatusCode.DELIVERED,
        ServiceHiringStatusCode.REVISION_REQUESTED,
        ServiceHiringStatusCode.PAYMENT_PENDING,
        ServiceHiringStatusCode.PAYMENT_REJECTED,
        // NO incluir IN_CLAIM aquí - se cuenta por separado
      ];

      const inProgressStatusIds =
        await this.getStatusIdsByCode(inProgressStatuses);

      const servicesInProgress = await this.serviceHiringRepo.count({
        where: {
          statusId: In(inProgressStatusIds),
        },
      });

      // Servicios en reclamo (estado IN_CLAIM)
      const inClaimStatusId = await this.getStatusId(
        ServiceHiringStatusCode.IN_CLAIM,
      );
      const servicesInClaim = await this.serviceHiringRepo.count({
        where: { statusId: inClaimStatusId },
      });

      // Total de servicios activos = en progreso + en reclamo
      const totalServicesActive = servicesInProgress + servicesInClaim;

      // ClaimRate = (servicios in_claim / total servicios activos) * 100
      const claimRate =
        totalServicesActive > 0
          ? (servicesInClaim / totalServicesActive) * 100
          : 0;

      // 6. RESOLUCIÓN DE RECLAMOS (tabla claims)
      const totalClaims = await this.claimRepository.count();

      // Claims resueltos: tienen resolutionType, resolvedBy y resolvedAt
      const resolvedClaims = await this.claimRepository.count({
        where: {
          resolutionType: Not(IsNull()),
          resolvedBy: Not(IsNull()),
          resolvedAt: Not(IsNull()),
        },
      });

      const resolutionRate =
        totalClaims > 0 ? (resolvedClaims / totalClaims) * 100 : 0;

      // 7. TIEMPO PROMEDIO DE RESOLUCIÓN
      const resolvedClaimsWithTime = await this.claimRepository.find({
        where: {
          resolutionType: Not(IsNull()),
          resolvedAt: Not(IsNull()),
        },
        select: ['createdAt', 'resolvedAt'],
      });

      let averageResolutionTimeInHours = 0;
      if (resolvedClaimsWithTime.length > 0) {
        const totalResolutionTime = resolvedClaimsWithTime.reduce(
          (sum, claim) => {
            const createdAt = new Date(claim.createdAt);
            const resolvedAt = new Date(claim.resolvedAt!);
            const diffInMs = resolvedAt.getTime() - createdAt.getTime();
            const diffInHours = diffInMs / (1000 * 60 * 60);
            return sum + diffInHours;
          },
          0,
        );
        averageResolutionTimeInHours =
          totalResolutionTime / resolvedClaimsWithTime.length;
      }

      return {
        totalServicesHired,
        totalRevenue,
        byType,
        quotations: {
          sent: sentQuotations,
          accepted: acceptedQuotations,
          acceptanceRate: Math.round(quotationAcceptanceRate * 100) / 100,
        },
        claims: {
          totalClaims,
          resolvedClaims,
          servicesInProgress, // Servicios en progreso (SIN in_claim)
          totalServicesHired: totalServicesActive, // Total activos (progreso + reclamo)
          claimRate: Math.round(claimRate * 100) / 100,
          resolutionRate: Math.round(resolutionRate * 100) / 100,
          averageResolutionTimeInHours:
            Math.round(averageResolutionTimeInHours * 100) / 100,
        },
      };
    } catch (error) {
      console.error('Error getting admin service metrics:', error);
      return {
        totalServicesHired: 0,
        totalRevenue: 0,
        byType: [],
        quotations: {
          sent: 0,
          accepted: 0,
          acceptanceRate: 0,
        },
        claims: {
          totalClaims: 0,
          resolvedClaims: 0,
          servicesInProgress: 0,
          totalServicesHired: 0,
          claimRate: 0,
          resolutionRate: 0,
          averageResolutionTimeInHours: 0,
        },
      };
    }
  }

  /**
   * Obtiene el ID de un estado por su código
   */
  private async getStatusId(code: ServiceHiringStatusCode): Promise<number> {
    const status = await this.serviceHiringRepo.manager
      .getRepository('service_hiring_statuses')
      .findOne({ where: { code } });
    return status?.id || 0;
  }

  /**
   * Obtiene los IDs de múltiples estados por sus códigos
   */
  private async getStatusIdsByCode(
    codes: ServiceHiringStatusCode[],
  ): Promise<number[]> {
    const statuses = await this.serviceHiringRepo.manager
      .getRepository('service_hiring_statuses')
      .find({ where: { code: In(codes) } });
    return statuses.map((s) => s.id);
  }
}
