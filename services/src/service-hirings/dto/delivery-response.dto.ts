import { DeliverableResponseDto } from './deliverable-response.dto';

export class DeliverySubmissionResponseDto {
  id: number;
  hiringId: number;
  deliverableId?: number;
  deliveryType: string;
  content: string;
  attachmentPath?: string;
  attachmentUrl?: string; // URL completa para descargar el archivo
  price: number;
  status: string;
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
