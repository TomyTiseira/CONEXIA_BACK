import { Injectable } from '@nestjs/common';
import {
  PaginationInfo,
  calculatePagination,
} from '../../common/utils/pagination.utils';
import { TimeUnit } from '../../services/enums/time-unit.enum';
import {
  DeliverableResponseDto,
  GetServiceHiringsDto,
  PaymentModalityResponseDto,
} from '../dto';
import { Deliverable } from '../entities/deliverable.entity';
import { ServiceHiring } from '../entities/service-hiring.entity';
import { DeliverableRepository } from '../repositories/deliverable.repository';

export interface ServiceHiringResponse {
  id: number;
  serviceId: number;
  userId: number;
  name?: string;
  lastName?: string;
  description: string;
  quotedPrice?: number;
  estimatedHours?: number;
  estimatedTimeUnit?: TimeUnit;
  quotationNotes?: string;
  quotedAt?: Date;
  respondedAt?: Date;
  quotationValidityDays?: number;
  isExpired?: boolean;
  paymentModality?: PaymentModalityResponseDto;
  deliverables?: DeliverableResponseDto[];
  claimId?: string; // ID del claim activo cuando status es 'in_claim'
  status: {
    id: number;
    name: string;
    code: string;
  };
  service: {
    id: number;
    title: string;
    description: string;
    price: number;
    timeUnit: TimeUnit | null;
    images?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  availableActions: string[];
}

export interface ServiceHiringListResponse {
  data: ServiceHiringResponse[];
  pagination: PaginationInfo;
}

@Injectable()
export class ServiceHiringTransformService {
  constructor(private readonly deliverableRepository: DeliverableRepository) {}

  async transformToResponse(
    hiring: ServiceHiring,
    availableActions: string[] = [],
    user?: any,
    deliverablesMap?: Map<number, Deliverable[]>,
  ): Promise<ServiceHiringResponse> {
    const isExpired = this.isQuotationExpired(hiring);

    // Cargar entregables: usar mapa precargado o cargar individualmente
    const deliverables = deliverablesMap
      ? deliverablesMap.get(hiring.id) || []
      : await this.deliverableRepository.findByHiringId(hiring.id);

    // Extraer el claim activo si existe (cuando status es 'in_claim')
    const activeClaim =
      hiring.claims && hiring.claims.length > 0
        ? hiring.claims[0] // Ya viene ordenado por createdAt DESC desde el repository
        : null;

    return {
      id: hiring.id,
      serviceId: hiring.serviceId,
      userId: hiring.userId,
      name: user?.profile?.name,
      lastName: user?.profile?.lastName,
      description: hiring.description,
      quotedPrice: hiring.quotedPrice,
      estimatedHours: hiring.estimatedHours,
      estimatedTimeUnit: hiring.estimatedTimeUnit,
      quotationNotes: hiring.quotationNotes,
      quotedAt: hiring.quotedAt,
      respondedAt: hiring.respondedAt,
      quotationValidityDays: hiring.quotationValidityDays,
      isExpired,
      paymentModality: hiring.paymentModality
        ? {
            id: hiring.paymentModality.id,
            name: hiring.paymentModality.name,
            code: hiring.paymentModality.code,
            description: hiring.paymentModality.description,
            initialPaymentPercentage:
              hiring.paymentModality.initialPaymentPercentage,
            finalPaymentPercentage:
              hiring.paymentModality.finalPaymentPercentage,
            isActive: hiring.paymentModality.isActive,
          }
        : undefined,
      deliverables:
        deliverables.length > 0
          ? deliverables.map((d) => ({
              id: d.id,
              hiringId: d.hiringId,
              title: d.title,
              description: d.description,
              estimatedDeliveryDate: d.estimatedDeliveryDate,
              price: d.price,
              orderIndex: d.orderIndex,
              status: d.status,
              deliveredAt: d.deliveredAt,
              approvedAt: d.approvedAt,
              createdAt: d.createdAt,
              updatedAt: d.updatedAt,
            }))
          : undefined,
      claimId: activeClaim?.id, // Agregar el claimId si existe un claim activo
      status: {
        id: hiring.status.id,
        name: hiring.status.name,
        code: hiring.status.code,
      },
      service: {
        id: hiring.service.id,
        title: hiring.service.title,
        description: hiring.service.description,
        price: hiring.service.price,
        timeUnit: hiring.service.timeUnit || TimeUnit.HOURS,
        images: hiring.service.images,
      },
      createdAt: hiring.createdAt,
      updatedAt: hiring.updatedAt,
      availableActions,
    };
  }

  private isQuotationExpired(hiring: ServiceHiring): boolean {
    if (!hiring.quotedAt || !hiring.quotationValidityDays) {
      return false;
    }

    const expirationDate = new Date(hiring.quotedAt);
    expirationDate.setDate(
      expirationDate.getDate() + hiring.quotationValidityDays,
    );

    return new Date() > expirationDate;
  }

  transformToListResponse(
    hirings: ServiceHiring[],
    total: number,
    params: GetServiceHiringsDto,
    availableActionsMap: Map<number, string[]> = new Map(),
    usersMap?: Map<number, any>,
  ): Promise<ServiceHiringListResponse> {
    // Optimización: cargar todos los deliverables de una vez
    const hiringIds = hirings.map((h) => h.id);

    return this.deliverableRepository
      .findByHiringIds(hiringIds)
      .then((allDeliverables) => {
        // Agrupar deliverables por hiringId
        const deliverablesMap = new Map<number, Deliverable[]>();
        allDeliverables.forEach((deliverable) => {
          const existing = deliverablesMap.get(deliverable.hiringId) || [];
          existing.push(deliverable);
          deliverablesMap.set(deliverable.hiringId, existing);
        });

        // Transformar hirings con deliverables precargados
        const dataPromises = hirings.map((hiring) =>
          this.transformToResponse(
            hiring,
            availableActionsMap.get(hiring.id) || [],
            usersMap?.get(hiring.userId),
            deliverablesMap,
          ),
        );

        return Promise.all(dataPromises);
      })
      .then((data) => {
        const pagination = calculatePagination(total, {
          page: params.page || 1,
          limit: params.limit || 10,
        });

        return { data, pagination };
      });
  }
}
