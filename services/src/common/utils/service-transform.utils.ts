import { Service } from '../../services/entities/service.entity';

export interface TransformedService {
  id: number;
  title: string;
  description: string;
  price: number;
  estimatedHours?: number;
  images?: string[];
  status: string;
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
): TransformedService[] {
  return services.map((service) => {
    const owner = users.find((user) => user.id === service.userId);
    const isOwner = currentUserId === service.userId;

    return {
      id: service.id,
      title: service.title,
      description: service.description,
      price: service.price,
      estimatedHours: service.estimatedHours,
      images: service.images,
      status: service.status,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      category: {
        id: service.category.id,
        name: service.category.name,
        description: service.category.description,
      },
      owner: {
        id: owner.id,
        firstName: owner.profile?.name || owner.firstName || 'Usuario',
        lastName: owner.profile?.lastName || owner.lastName || '',
        email: owner.email || '',
        profileImage: owner.profile?.profilePicture || null,
      },
      isOwner,
    };
  });
}
