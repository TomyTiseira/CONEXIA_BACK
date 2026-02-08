import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PaymentAccountsClientService } from '../../common/services/payment-accounts-client.service';
import { UsersClientService } from '../../common/services/users-client.service';
import { ServicesService } from '../../services/services/services.service';
import { ServiceHiringStatusCode } from '../enums/service-hiring-status.enum';
import { ServiceHiringRepository } from '../repositories/service-hiring.repository';
import { ServiceHiringStatusService } from './service-hiring-status.service';

@Injectable()
export class ServiceHiringValidationService {
  constructor(
    private readonly usersClientService: UsersClientService,
    private readonly servicesService: ServicesService,
    private readonly paymentAccountsClientService: PaymentAccountsClientService,
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly statusService: ServiceHiringStatusService,
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

    // Validar que el dueño del servicio no esté suspendido o baneado
    const ownerStatus = await this.usersClientService.checkUserAccountStatus(
      serviceResponse.owner.id,
    );
    if (ownerStatus.isBanned) {
      throw new RpcException(
        'No puedes solicitar cotización para este servicio porque el proveedor tiene la cuenta baneada permanentemente',
      );
    }
    if (ownerStatus.isSuspended) {
      throw new RpcException(
        'No puedes solicitar cotización para este servicio porque el proveedor tiene la cuenta suspendida temporalmente',
      );
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
    hiringId?: number,
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

    // Validar que el usuario solicitante sigue activo (incluir eliminados para poder detectar si fue dado de baja)
    const user =
      await this.usersClientService.getUserByIdIncludingDeleted(userId);
    if (!user) {
      throw new RpcException('Usuario solicitante no encontrado');
    }

    if (!user.isValidate || user.deletedAt) {
      // Si tenemos el hiringId, rechazar automáticamente la solicitud
      if (hiringId) {
        await this.rejectHiringAutomatically(hiringId);
      }
      throw new RpcException(
        'El usuario solicitante fue dado de baja o baneado. La solicitud ha sido rechazada automáticamente.',
      );
    }

    // Validar que el dueño del servicio tiene al menos una cuenta de pago activa
    const hasActivePaymentAccount =
      await this.paymentAccountsClientService.hasActivePaymentAccount(
        serviceOwnerId,
      );
    if (!hasActivePaymentAccount) {
      throw new RpcException(
        'Para generar una cotización debes tener al menos una cuenta bancaria o digital activa registrada. Ve a tu perfil para agregar una cuenta de pago.',
      );
    }

    return { serviceOwner, user };
  }

  async validateUserCanContractService(
    userId: number,
    hiringId: number,
  ): Promise<{ user: any; hiring: any }> {
    // Obtener la contratación
    const hiring = await this.hiringRepository.findById(hiringId);
    if (!hiring) {
      throw new RpcException('Contratación no encontrada');
    }

    // Verificar que el usuario es el solicitante del servicio
    if (hiring.userId !== userId) {
      throw new RpcException('No tienes permisos para contratar este servicio');
    }

    // Validar que el usuario existe y está activo
    const user =
      await this.usersClientService.getUserByIdIncludingDeleted(userId);
    if (!user) {
      throw new RpcException('Usuario no encontrado');
    }

    if (!user.isValidate || user.deletedAt) {
      throw new RpcException('El usuario no está activo');
    }

    // Validar que la solicitud está en estado "accepted" (aceptada)
    if (hiring.status.code !== ServiceHiringStatusCode.ACCEPTED) {
      throw new RpcException(
        'Solo se pueden contratar servicios con cotización aceptada',
      );
    }

    // Validar que no tenga ya una contratación activa del mismo servicio
    const existingActiveHiring =
      await this.hiringRepository.findActiveHiringByUserAndService(
        userId,
        hiring.serviceId,
      );

    if (existingActiveHiring && existingActiveHiring.id !== hiringId) {
      throw new RpcException(
        'Ya tienes una contratación activa de este servicio. Debes completarla antes de contratar nuevamente.',
      );
    }

    return { user, hiring };
  }

  private async rejectHiringAutomatically(hiringId: number): Promise<void> {
    try {
      // Obtener el estado "rejected"
      const rejectedStatus = await this.statusService.getStatusByCode(
        ServiceHiringStatusCode.REJECTED,
      );

      // Actualizar la contratación a rechazada
      await this.hiringRepository.update(hiringId, {
        statusId: rejectedStatus.id,
        respondedAt: new Date(),
      });
    } catch (error) {
      console.error('Error al rechazar automáticamente la solicitud:', error);
      // No lanzamos la excepción aquí para no interferir con el flujo principal
    }
  }
}
