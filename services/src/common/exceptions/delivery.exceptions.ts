import { RpcException } from '@nestjs/microservices';

export class PreviousDeliverableNotPaidException extends RpcException {
  constructor(previousDeliverableTitle: string, deliveryId: number) {
    super({
      status: 403,
      message: `No puedes ver este entregable porque el entregable anterior "${previousDeliverableTitle}" aún no ha sido pagado. El cliente debe aprobar y pagar la entrega #${deliveryId} primero.`,
    });
  }
}

export class PreviousDeliverableNotDeliveredYetException extends RpcException {
  constructor(
    previousDeliverableTitle: string,
    previousDeliverableOrder: number,
  ) {
    super({
      status: 403,
      message: `No puedes entregar este entregable porque primero debes completar el entregable anterior: "${previousDeliverableTitle}" (Entregable #${previousDeliverableOrder}).`,
    });
  }
}

export class DeliverableNotFoundException extends RpcException {
  constructor(deliverableId: number) {
    super({
      status: 404,
      message: `Entregable con ID ${deliverableId} no encontrado`,
    });
  }
}

export class DeliveryNotFoundException extends RpcException {
  constructor(deliveryId: number) {
    super({
      status: 404,
      message: `Entrega con ID ${deliveryId} no encontrada`,
    });
  }
}
