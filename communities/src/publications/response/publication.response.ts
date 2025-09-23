import { PublicationPrivacy } from '../enums/privacy.enum';

export interface MediaResponseDto {
  id: number;
  fileUrl: string;
  filename: string;
  fileType: string;
  fileSize: number;
  displayOrder: number;
}

export class PublicationResponseDto {
  id: number;
  description: string;
  // Nuevos campos para múltiples archivos
  media?: MediaResponseDto[];
  // Campos legacy (mantener para compatibilidad temporal)
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
  isContact?: boolean; // Indica si el usuario actual es contacto del autor
}
