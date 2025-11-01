import { DeliverableResponseDto } from './deliverable-response.dto';

export class DeliveryAttachmentResponseDto {
  id: number;
  filePath: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  orderIndex: number;
}

export class DeliverySubmissionResponseDto {
  id: number;
  hiringId: number;
  deliverableId?: number;
  deliveryType: string;
  content: string;
  attachmentPath?: string; // Path relativo: /uploads/deliveries/archivo.ext (DEPRECATED, usar attachments[])
  attachmentUrl?: string; // Mismo que attachmentPath, el frontend construye la URL (DEPRECATED, usar attachments[])
  attachmentSize?: number; // Tamaño del archivo en bytes (DEPRECATED, usar attachments[])
  attachments?: DeliveryAttachmentResponseDto[]; // Array de archivos adjuntos
  price: number;
  status: string;
  needsWatermark: boolean; // true si el contenido debe mostrarse con marca de agua (status !== APPROVED)
  deliveredAt?: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  revisionNotes?: string;
  deliverable?: DeliverableResponseDto;
  createdAt: Date;
  updatedAt: Date;
}

export class DeliverySubmissionListResponseDto {
  deliveries: DeliverySubmissionResponseDto[];
  total: number;
}
