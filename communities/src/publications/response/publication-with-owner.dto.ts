import { PublicationPrivacy } from '../enums/privacy.enum';

export class OwnerDto {
  id: number;
  name: string;
  profilePicture?: string;
  profession: string;
}

export class PublicationWithOwnerDto {
  id: number;
  description: string;
  mediaUrl?: string;
  mediaFilename?: string;
  mediaSize?: number;
  mediaType?: string;
  privacy: PublicationPrivacy;
  userId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  isOwner: boolean;
  owner: OwnerDto;
}
