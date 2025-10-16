export class DeliverableResponseDto {
  id: number;
  hiringId: number;
  title: string;
  description: string;
  estimatedDeliveryDate: Date;
  price: number;
  orderIndex: number;
  status: string;
  deliveredAt?: Date;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
