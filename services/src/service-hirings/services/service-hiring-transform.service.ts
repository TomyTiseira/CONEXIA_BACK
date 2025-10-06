import { Injectable } from '@nestjs/common';
import {
  PaginationInfo,
  calculatePagination,
} from '../../common/utils/pagination.utils';
import { TimeUnit } from '../../services/enums/time-unit.enum';
import { GetServiceHiringsDto } from '../dto';
import { ServiceHiring } from '../entities/service-hiring.entity';

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
  transformToResponse(
    hiring: ServiceHiring,
    availableActions: string[] = [],
    user?: any,
  ): ServiceHiringResponse {
    const isExpired = this.isQuotationExpired(hiring);

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
  ): ServiceHiringListResponse {
    const data = hirings.map((hiring) =>
      this.transformToResponse(
        hiring,
        availableActionsMap.get(hiring.id) || [],
        usersMap?.get(hiring.userId),
      ),
    );

    const pagination = calculatePagination(total, {
      page: params.page || 1,
      limit: params.limit || 10,
    });

    return { data, pagination };
  }
}
