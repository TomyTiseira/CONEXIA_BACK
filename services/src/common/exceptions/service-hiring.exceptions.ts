import { RpcException } from '@nestjs/microservices';

export class ServiceHiringNotFoundException extends RpcException {
  constructor(hiringId: number) {
    super({
      message: `Contratación con ID ${hiringId} no encontrada`,
      status: 404,
      error: 'Service Hiring Not Found',
    });
  }
}

export class OnlyClientCanRequestRequoteException extends RpcException {
  constructor() {
    super({
      message: 'Solo el cliente puede solicitar re-cotización',
      status: 403,
      error: 'Forbidden',
    });
  }
}

export class InvalidStatusForRequoteException extends RpcException {
  constructor(currentStatus: string) {
    super({
      message: `Solo se puede solicitar re-cotización de cotizaciones en estado "quoted". Estado actual: ${currentStatus}`,
      status: 400,
      error: 'Bad Request',
    });
  }
}

export class QuotationNotExpiredException extends RpcException {
  constructor() {
    super({
      message: 'Solo se puede solicitar re-cotización de cotizaciones vencidas',
      status: 400,
      error: 'Bad Request',
    });
  }
}

export class UserBannedOrDeletedRequoteException extends RpcException {
  constructor(userType: 'client' | 'provider') {
    const message =
      userType === 'client'
        ? 'Usuario baneado o dado de baja'
        : 'El proveedor no puede recibir solicitudes en este momento';

    super({
      message,
      status: userType === 'client' ? 403 : 400,
      error: userType === 'client' ? 'Forbidden' : 'Bad Request',
    });
  }
}

export class RequoteLimitReachedException extends RpcException {
  constructor(limit: number) {
    super({
      message: `Límite de re-cotizaciones alcanzado (${limit}). Por favor, cancela y crea una nueva solicitud`,
      status: 400,
      error: 'Bad Request',
    });
  }
}
