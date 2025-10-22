import { RpcException } from '@nestjs/microservices';

export class UserNotVerifiedException extends RpcException {
  constructor() {
    super({
      status: 403,
      message:
        'Usuario no verificado. Debe verificar su identidad antes de realizar esta acción. Por favor, diríjase a su perfil para completar el proceso de verificación.',
      code: 'USER_NOT_VERIFIED',
    });
  }
}

export class UserNotFoundException extends RpcException {
  constructor(userId: number) {
    super({
      status: 404,
      message: `Usuario con ID ${userId} no encontrado`,
      code: 'USER_NOT_FOUND',
    });
  }
}
