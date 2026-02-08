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

  // 🆕 Campos de control para el frontend
  isLocked?: boolean; // Si está bloqueado porque el anterior no se pagó
  lockReason?: string; // Razón del bloqueo
  canDeliver?: boolean; // Si el proveedor puede subir una entrega
  canView?: boolean; // Si el cliente puede ver el entregable
  latestDeliveryId?: number; // ID de la última entrega si existe
  latestDeliveryStatus?: string; // Estado de la última entrega
}
