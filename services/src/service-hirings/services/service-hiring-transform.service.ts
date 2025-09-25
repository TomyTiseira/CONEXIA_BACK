import { Injectable } from '@nestjs/common';
import {
  PaginationInfo,
  calculatePagination,
} from '../../common/utils/pagination.utils';
import { GetServiceHiringsDto } from '../dto';
import { ServiceHiring } from '../entities/service-hiring.entity';

export interface ServiceHiringResponse {
  id: number;
  serviceId: number;
  userId: number;
  description: string;
  quotedPrice?: number;
  estimatedHours?: number;
  quotationNotes?: string;
  quotedAt?: Date;
  respondedAt?: Date;
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
  ): ServiceHiringResponse {
    return {
      id: hiring.id,
      serviceId: hiring.serviceId,
      userId: hiring.userId,
      description: hiring.description,
      quotedPrice: hiring.quotedPrice,
      estimatedHours: hiring.estimatedHours,
      quotationNotes: hiring.quotationNotes,
      quotedAt: hiring.quotedAt,
      respondedAt: hiring.respondedAt,
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
        images: hiring.service.images,
      },
      createdAt: hiring.createdAt,
      updatedAt: hiring.updatedAt,
      availableActions,
    };
  }

  transformToListResponse(
    hirings: ServiceHiring[],
    total: number,
    params: GetServiceHiringsDto,
    availableActionsMap: Map<number, string[]> = new Map(),
  ): ServiceHiringListResponse {
    const data = hirings.map((hiring) =>
      this.transformToResponse(
        hiring,
        availableActionsMap.get(hiring.id) || [],
      ),
    );

    const pagination = calculatePagination(total, {
      page: params.page || 1,
      limit: params.limit || 10,
    });

    return { data, pagination };
  }
}
