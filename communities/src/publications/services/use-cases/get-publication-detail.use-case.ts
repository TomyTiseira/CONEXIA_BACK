import { Injectable } from '@nestjs/common';
import { PublicationNotFoundException } from 'src/common/exceptions/publications.exceptions';
import { PublicationRepository } from '../../repositories/publication.repository';
import { ConnectionStatusService } from '../helpers/connection-status.service';
import { ContactHelperService } from '../helpers/contact-helper.service';
import { OwnerHelperService } from '../helpers/owner-helper.service';

export interface PublicationDetailResponse {
  id: number;
  description: string;
  mediaUrl?: string;
  mediaType?: string;
  privacy: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  deletedAt?: Date;
  owner: {
    id: number;
    name: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  reactionsCount: {
    like: number;
    love: number;
    idea: number;
    laugh: number;
    helpful: number;
  };
  commentsCount: number;
  userReaction?: string;
}

@Injectable()
export class GetPublicationDetailUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly ownerHelperService: OwnerHelperService,
    private readonly contactHelperService: ContactHelperService,
    private readonly connectionStatusService: ConnectionStatusService,
  ) {}

  async execute(
    id: number,
    currentUserId?: number,
  ): Promise<PublicationDetailResponse> {
    // Obtener la publicación con contadores
    const publicationWithDetails =
      await this.publicationRepository.findActivePublicationByIdWithDetails(
        id,
        currentUserId,
      );

    if (!publicationWithDetails) {
      throw new PublicationNotFoundException(id);
    }

    // Obtener información del propietario
    const ownerMap = await this.ownerHelperService.getOwnersInfo([
      { userId: publicationWithDetails.userId },
    ]);

    const owner = ownerMap.get(publicationWithDetails.userId) || {
      id: publicationWithDetails.userId,
      name: `Usuario ${publicationWithDetails.userId}`,
      lastName: '',
      email: '',
      profilePicture: undefined,
      profession: 'Sin profesión',
    };

    return {
      id: publicationWithDetails.id,
      description: publicationWithDetails.description,
      mediaUrl: publicationWithDetails.mediaUrl,
      mediaType: publicationWithDetails.mediaType,
      privacy: publicationWithDetails.privacy,
      userId: publicationWithDetails.userId,
      createdAt: publicationWithDetails.createdAt,
      updatedAt: publicationWithDetails.updatedAt,
      isActive: publicationWithDetails.isActive,
      deletedAt: publicationWithDetails.deletedAt,
      owner: {
        id: owner.id,
        name: owner.name,
        lastName: owner.lastName || '',
        email: owner.email || '',
        profilePicture: owner.profilePicture || undefined,
      },
      reactionsCount: publicationWithDetails.reactionsCount,
      commentsCount: publicationWithDetails.commentsCount,
      userReaction: publicationWithDetails.userReaction,
    };
  }
}
