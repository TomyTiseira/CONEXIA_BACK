import { Service } from '../../services/entities/service.entity';
import { TimeUnit } from '../../services/enums/time-unit.enum';

export interface TransformedService {
  id: number;
  title: string;
  description: string;
  price: number;
  estimatedHours?: number | null;
  timeUnit: TimeUnit | null;
  images?: string[];
  status: string;
  isActive: boolean;
  hasPendingQuotation?: boolean;
  hasActiveQuotation?: boolean;
  pendingQuotationId?: number;
  activeQuotationId?: number;
  reviews?: {
    averageRating: number;
    totalReviews: number;
  };
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    name: string;
    description?: string;
  };
  owner: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string | null;
  };
  isOwner: boolean;
}

export function transformServicesWithOwners(
  services: Service[],
  users: any[],
  currentUserId?: number,
  quotationInfo?: Map<
    number,
    {
      hasPending: boolean;
      hasActive: boolean;
      pendingQuotationId?: number;
      activeQuotationId?: number;
    }
  >,
  reviewsInfo?: Map<
    number,
    {
      averageRating: number;
      totalReviews: number;
    }
  >,
): TransformedService[] {
  return services.map((service) => {
    const owner = users.find((user) => user.id === service.userId);
    const isOwner = currentUserId === service.userId;
    const quotationData = quotationInfo?.get(service.id);
    const reviewsData = reviewsInfo?.get(service.id);

    return {
      id: service.id,
      title: service.title,
      description: service.description,
      price: service.price,
      estimatedHours: service.estimatedHours,
      timeUnit: service.timeUnit || TimeUnit.HOURS,
      images: service.images,
      status: service.status,
      isActive: service.status === 'active',
      hasPendingQuotation: quotationData?.hasPending || false,
      hasActiveQuotation: quotationData?.hasActive || false,
      pendingQuotationId: quotationData?.pendingQuotationId || undefined,
      activeQuotationId: quotationData?.activeQuotationId || undefined,
      reviews: reviewsData
        ? {
            averageRating: reviewsData.averageRating,
            totalReviews: reviewsData.totalReviews,
          }
        : undefined,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      category: {
        id: service.category.id,
        name: service.category.name,
        description: service.category.description,
      },
      owner: {
        id: owner?.id || service.userId,
        firstName: owner?.profile?.name || owner?.firstName || '',
        lastName: owner?.profile?.lastName || owner?.lastName || '',
        email: owner?.email || '',
        profileImage: owner?.profile?.profilePicture || null,
      },
      isOwner,
    };
  });
}
