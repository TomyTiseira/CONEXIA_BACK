import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CreateServiceHiringDto } from '../../dto';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { ServiceHiringStatusService } from '../service-hiring-status.service';
import { ServiceHiringTransformService } from '../service-hiring-transform.service';
import { ServiceHiringValidationService } from '../service-hiring-validation.service';

@Injectable()
export class CreateServiceHiringUseCase {
  constructor(
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly statusService: ServiceHiringStatusService,
    private readonly validationService: ServiceHiringValidationService,
    private readonly transformService: ServiceHiringTransformService,
  ) {}

  async execute(userId: number, createDto: CreateServiceHiringDto) {
    // Validar que el usuario puede contratar el servicio
    await this.validationService.validateUserCanHireService(
      userId,
      createDto.serviceId,
    );

    // Verificar si ya existe una contratación activa para este servicio por este usuario
    const existingHiring = await this.hiringRepository.findByUserAndService(
      userId,
      createDto.serviceId,
    );
    if (
      existingHiring &&
      existingHiring.status.code === ServiceHiringStatusCode.PENDING
    ) {
      throw new RpcException(
        'Ya tienes una solicitud pendiente para este servicio',
      );
    }

    // Obtener el estado "pending"
    const pendingStatus = await this.statusService.getStatusByCode(
      ServiceHiringStatusCode.PENDING,
    );

    // Crear la contratación
    const hiring = await this.hiringRepository.create({
      userId,
      serviceId: createDto.serviceId,
      description: createDto.description,
      statusId: pendingStatus.id,
    });

    // Obtener la contratación creada con las relaciones
    const createdHiring = await this.hiringRepository.findById(hiring.id);
    if (!createdHiring) {
      throw new RpcException('Error al crear la contratación');
    }

    return this.transformService.transformToResponse(createdHiring);
  }
}
