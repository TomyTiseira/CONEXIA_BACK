import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PeerReviewComplianceDto } from '../../../dto/compliance.dto';
import { ClaimCompliance } from '../../../entities/claim-compliance.entity';
import { ComplianceStatus } from '../../../enums/compliance.enum';
import { ClaimComplianceRepository } from '../../../repositories/claim-compliance.repository';
import { ServiceHiringRepository } from '../../../repositories/service-hiring.repository';

/**
 * Use case para que la contraparte revise y pre-apruebe/objete un compliance
 */
@Injectable()
export class PeerReviewComplianceUseCase {
  constructor(
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly hiringRepository: ServiceHiringRepository,
  ) {}

  async execute(dto: PeerReviewComplianceDto): Promise<ClaimCompliance> {
    // 1. Buscar el compliance con su claim
    const compliance = await this.complianceRepository.findOne({
      where: { id: dto.complianceId },
      relations: ['claim'],
    });
    if (!compliance) {
      throw new NotFoundException(
        `Compliance con ID ${dto.complianceId} no encontrado`,
      );
    }

    // 2. Validar estado
    if (compliance.status !== ComplianceStatus.SUBMITTED) {
      throw new BadRequestException(
        'Solo se puede revisar un compliance en estado SUBMITTED',
      );
    }

    // 3. Obtener el hiring para determinar quién es la contraparte
    const hiring = await this.hiringRepository.findById(
      compliance.claim.hiringId,
      ['service'],
    );

    if (!hiring) {
      throw new NotFoundException(
        `Hiring con ID ${compliance.claim.hiringId} no encontrado`,
      );
    }

    // 4. Validar que el usuario sea la contraparte (no el responsable)
    const isClient = hiring.userId === parseInt(dto.userId);
    const isProvider = hiring.service.userId === parseInt(dto.userId);
    const isCounterpart =
      (compliance.responsibleUserId === hiring.userId.toString() &&
        isProvider) ||
      (compliance.responsibleUserId === hiring.service.userId.toString() &&
        isClient);

    if (!isCounterpart) {
      throw new ForbiddenException(
        'Solo la contraparte puede hacer peer review',
      );
    }

    // 5. Actualizar compliance según la decisión
    if (dto.approved) {
      compliance.status = ComplianceStatus.PEER_APPROVED;
      compliance.peerReviewedAt = new Date();
      compliance.peerObjection = dto.objection || null;
      console.log(
        `[PeerReviewComplianceUseCase] Compliance ${compliance.id} pre-aprobado por peer`,
      );
    } else {
      compliance.status = ComplianceStatus.PEER_OBJECTED;
      compliance.peerReviewedAt = new Date();
      compliance.peerObjection =
        dto.objection || 'Rechazado por la contraparte';
      console.log(
        `[PeerReviewComplianceUseCase] Compliance ${compliance.id} objetado por peer`,
      );
    }

    await this.complianceRepository.save(compliance);

    // TODO: Notificar al moderador y al responsable del resultado

    return compliance;
  }
}
