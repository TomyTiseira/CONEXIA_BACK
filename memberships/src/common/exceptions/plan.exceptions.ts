import { RpcException } from '@nestjs/microservices';

export class PlanNotFoundException extends RpcException {
  constructor(planId: number) {
    super({
      message: `plan with ID ${planId} not found`,
      status: 404,
      error: 'Plan Not Found',
    });
  }
}

export class PlanAlreadyDeletedException extends RpcException {
  constructor(planId: number) {
    super({
      message: `plan with ID ${planId} has already been deleted`,
      status: 409,
      error: 'Plan Already Deleted',
    });
  }
}

export class PlanBadRequestException extends RpcException {
  constructor(message: string) {
    super({
      message,
      status: 400,
      error: 'Bad Request',
    });
  }
}

export class PlanMercadoPagoSyncException extends RpcException {
  constructor(message: string, details?: string) {
    super({
      message: details
        ? `Error al sincronizar con MercadoPago: ${message}. ${details}`
        : `Error al sincronizar con MercadoPago: ${message}`,
      status: 400,
      error: 'MercadoPago Sync Failed',
      code: 'MERCADOPAGO_SYNC_ERROR',
    });
  }
}
