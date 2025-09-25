import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UsersClientService } from '../../common/services/users-client.service';
import { ServicesService } from '../../services/services/services.service';

@Injectable()
export class ServiceHiringValidationService {
  constructor(
    private readonly usersClientService: UsersClientService,
    private readonly servicesService: ServicesService,
  ) {}

  async validateUserCanHireService(
    userId: number,
    serviceId: number,
  ): Promise<{ user: any; service: any }> {
    // Validar que el usuario existe y está activo
    const user = await this.usersClientService.getUserById(userId);
    if (!user) {
      throw new RpcException('Usuario no encontrado');
    }

    // Un usuario está activo si está validado y no está eliminado
    if (!user.isValidate) {
      throw new RpcException('El usuario no ha verificado su email');
    }

    if (user.deletedAt) {
      throw new RpcException('El usuario ha sido eliminado');
    }

    // Validar roles - solo usuarios pueden contratar servicios
    const forbiddenRoles = ['administrador', 'moderador'];
    if (
      user.roles &&
      user.roles.some((role: any) => forbiddenRoles.includes(role.name))
    ) {
      throw new RpcException(
        'Los administradores y moderadores no pueden contratar servicios',
      );
    }

    // Validar que el servicio existe
    const serviceResponse = await this.servicesService.getServiceById({
      id: serviceId,
      currentUserId: userId,
    });
    if (!serviceResponse) {
      throw new RpcException('Servicio no encontrado');
    }

    // Validar que el usuario no es el dueño del servicio
    if (serviceResponse.isOwner) {
      throw new RpcException('No puedes contratar tu propio servicio');
    }

    return { user, service: serviceResponse };
  }

  async validateServiceOwnerCanQuote(
    serviceOwnerId: number,
    userId: number,
  ): Promise<{ serviceOwner: any; user: any }> {
    // Validar que el dueño del servicio existe y está activo
    const serviceOwner =
      await this.usersClientService.getUserById(serviceOwnerId);
    if (!serviceOwner) {
      throw new RpcException('Dueño del servicio no encontrado');
    }

    if (!serviceOwner.isValidate || serviceOwner.deletedAt) {
      throw new RpcException('El dueño del servicio no está activo');
    }

    // Validar que el usuario solicitante sigue activo
    const user = await this.usersClientService.getUserById(userId);
    if (!user) {
      throw new RpcException('Usuario solicitante no encontrado');
    }

    if (!user.isValidate || user.deletedAt) {
      throw new RpcException(
        'El usuario solicitante fue dado de baja o baneado. La solicitud debe ser cancelada.',
      );
    }

    return { serviceOwner, user };
  }
}
