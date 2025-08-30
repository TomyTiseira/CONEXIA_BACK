import { PublicationPrivacy } from '../enums/privacy.enum';

export class PublicationResponseDto {
  id: number;
  description: string;
  mediaUrl?: string;
  mediaFilename?: string;
  mediaSize?: number;
  mediaType?: string;
  userId: number;
  privacy: PublicationPrivacy;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  isOwner?: boolean; // Solo para endpoints que requieren currentUserId
}
