import { Injectable } from '@nestjs/common';
import {
  PaginationInfo,
  calculatePagination,
} from '../../common/utils/pagination.utils';
import { ServiceReviewRepository } from '../../service-reviews/repositories/service-review.repository';
import { TimeUnit } from '../../services/enums/time-unit.enum';
import {
  DeliverableResponseDto,
  GetServiceHiringsDto,
  PaymentModalityResponseDto,
} from '../dto';
import { Deliverable } from '../entities/deliverable.entity';
import { ServiceHiring } from '../entities/service-hiring.entity';
import { ServiceHiringStatusCode } from '../enums/service-hiring-status.enum';
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
  hasReview?: boolean; // Indica si ya existe una reseña para este hiring
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
  owner?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string | null;
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
  constructor(
    private readonly deliverableRepository: DeliverableRepository,
    private readonly serviceReviewRepository: ServiceReviewRepository,
  ) {}

  async transformToResponse(
    hiring: ServiceHiring,
    availableActions: string[] = [],
    user?: any,
    deliverablesMap?: Map<number, Deliverable[]>,
    owner?: any,
    reviewsMap?: Map<number, boolean>,
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

    // Verificar si existe una reseña para este hiring (solo para estados completables)
    const reviewableStatuses = [
      ServiceHiringStatusCode.COMPLETED,
      ServiceHiringStatusCode.COMPLETED_BY_CLAIM,
      ServiceHiringStatusCode.COMPLETED_WITH_AGREEMENT,
    ];
    const isReviewable = reviewableStatuses.includes(hiring.status.code as ServiceHiringStatusCode);
    
    let hasReview: boolean | undefined = undefined;
    if (isReviewable) {
      // Usar mapa precargado o consultar individualmente
      if (reviewsMap !== undefined) {
        hasReview = reviewsMap.get(hiring.id) || false;
      } else {
        const existingReview = await this.serviceReviewRepository.findByHiringId(hiring.id);
        hasReview = existingReview !== null;
      }
    }

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
      hasReview: hasReview, // Indica si ya existe una reseña para este hiring (solo en estados completables)
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
      owner: owner
        ? {
            id: owner.id,
            firstName: owner.profile?.name || owner.firstName || 'Usuario',
            lastName: owner.profile?.lastName || owner.lastName || '',
            email: owner.email || '',
            profileImage: owner.profile?.profilePicture || null,
          }
        : undefined,
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

  async transformToListResponse(
    hirings: ServiceHiring[],
    total: number,
    params: GetServiceHiringsDto,
    availableActionsMap: Map<number, string[]> = new Map(),
    usersMap?: Map<number, any>,
    ownersMap?: Map<number, any>,
  ): Promise<ServiceHiringListResponse> {
    // Optimización: cargar todos los deliverables de una vez
    const hiringIds = hirings.map((h) => h.id);

    // Cargar deliverables
    const allDeliverables = await this.deliverableRepository.findByHiringIds(hiringIds);

    // Agrupar deliverables por hiringId
    const deliverablesMap = new Map<number, Deliverable[]>();
    allDeliverables.forEach((deliverable) => {
      const existing = deliverablesMap.get(deliverable.hiringId) || [];
      existing.push(deliverable);
      deliverablesMap.set(deliverable.hiringId, existing);
    });

    // Identificar hirings en estados completables para verificar reseñas
    const reviewableStatuses = [
      ServiceHiringStatusCode.COMPLETED,
      ServiceHiringStatusCode.COMPLETED_BY_CLAIM,
      ServiceHiringStatusCode.COMPLETED_WITH_AGREEMENT,
    ];
    const reviewableHiringIds = hirings
      .filter((h) => reviewableStatuses.includes(h.status.code as ServiceHiringStatusCode))
      .map((h) => h.id);

    // Cargar reseñas en batch para hirings completables
    const reviewsMap = new Map<number, boolean>();
    if (reviewableHiringIds.length > 0) {
      const reviewsPromises = reviewableHiringIds.map(async (hiringId) => {
        const review = await this.serviceReviewRepository.findByHiringId(hiringId);
        return { hiringId, hasReview: review !== null };
      });
      const reviewsResults = await Promise.all(reviewsPromises);
      reviewsResults.forEach(({ hiringId, hasReview }) => {
        reviewsMap.set(hiringId, hasReview);
      });
    }

    // Transformar hirings con datos precargados
    const dataPromises = hirings.map((hiring) => {
      const ownerId = hiring.service?.userId;
      const owner = ownersMap?.get(ownerId);

      return this.transformToResponse(
        hiring,
        availableActionsMap.get(hiring.id) || [],
        usersMap?.get(hiring.userId),
        deliverablesMap,
        owner,
        reviewsMap,
      );
    });

    const data = await Promise.all(dataPromises);

    const pagination = calculatePagination(total, {
      page: params.page || 1,
      limit: params.limit || 10,
    });

    return { data, pagination };
  }
}
