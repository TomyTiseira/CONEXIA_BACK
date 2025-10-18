import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PaymentModalityCode } from '../../enums/payment-modality.enum';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { ServiceHiringOperationsService } from '../service-hiring-operations.service';
import { ServiceHiringStatusService } from '../service-hiring-status.service';
import { ServiceHiringTransformService } from '../service-hiring-transform.service';

@Injectable()
export class AcceptServiceHiringUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly statusService: ServiceHiringStatusService,
    private readonly operationsService: ServiceHiringOperationsService,
    private readonly transformService: ServiceHiringTransformService,
  ) {}

  async execute(userId: number, hiringId: number) {
    // Obtener la contratación con sus relaciones
    const hiring = await this.hiringRepository.findById(hiringId, [
      'status',
      'paymentModality',
    ]);
    if (!hiring) {
      throw new RpcException('Contratación no encontrada');
    }

    // Verificar que el usuario es el dueño de la contratación
    if (hiring.userId !== userId) {
      throw new RpcException(
        'No tienes permisos para aceptar esta contratación',
      );
    }

    // Validar que se puede aceptar
    if (!(await this.operationsService.canPerformAction(hiring, 'accept'))) {
      throw new RpcException(
        'No se puede aceptar esta contratación en su estado actual',
      );
    }

    // Determinar el estado según la modalidad de pago
    let targetStatusCode: ServiceHiringStatusCode;

    if (hiring.paymentModality?.code === PaymentModalityCode.BY_DELIVERABLES) {
      // Para pago por entregables: ir directamente a APPROVED
      // (no hay pago inicial del 25%, se paga después de cada entrega)
      targetStatusCode = ServiceHiringStatusCode.APPROVED;
    } else {
      // Para pago total: ir a ACCEPTED (luego debe pagar el 25% inicial)
      targetStatusCode = ServiceHiringStatusCode.ACCEPTED;
    }

    // Obtener el estado correspondiente
    let targetStatus;
    try {
      targetStatus = await this.statusService.getStatusByCode(targetStatusCode);
    } catch (error) {
      console.error('❌ Error getting status:', {
        targetStatusCode,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }

    // Actualizar la contratación
    const updatedHiring = await this.hiringRepository.update(hiring.id, {
      statusId: targetStatus.id,
      respondedAt: new Date(),
    });

    if (!updatedHiring) {
      throw new RpcException('Error al aceptar la contratación');
    }

    // Recargar con todas las relaciones necesarias para la respuesta
    const hiringWithRelations = await this.hiringRepository.findById(
      hiring.id,
      ['status', 'service', 'paymentModality', 'deliverables'],
    );

    if (!hiringWithRelations) {
      throw new RpcException('Error al cargar la contratación actualizada');
    }

    return this.transformService.transformToResponse(hiringWithRelations);
  }
}
