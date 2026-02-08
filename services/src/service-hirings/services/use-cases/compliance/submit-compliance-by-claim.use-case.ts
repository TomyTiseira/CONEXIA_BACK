import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClaimComplianceRepository } from '../../../repositories/claim-compliance.repository';
import { ClaimRepository } from '../../../repositories/claim.repository';
import { SubmitComplianceUseCase } from './submit-compliance.use-case';

@Injectable()
export class SubmitComplianceByClaimUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly complianceRepository: ClaimComplianceRepository,
    private readonly submitComplianceUseCase: SubmitComplianceUseCase,
  ) {}

  async execute(payload: {
    claimId: string;
    complianceId: string;
    userId: string;
    userNotes?: string;
    evidenceUrls?: string[];
  }) {
    // Validar que el claim existe
    const claim = await this.claimRepository.findById(payload.claimId);
    if (!claim) {
      throw new NotFoundException(
        `Reclamo con ID ${payload.claimId} no encontrado`,
      );
    }

    // Validar que el compliance existe
    const compliance = await this.complianceRepository.findById(
      payload.complianceId,
    );
    if (!compliance) {
      throw new NotFoundException(
        `Cumplimiento con ID ${payload.complianceId} no encontrado`,
      );
    }

    // Validar que el compliance pertenece al claim
    if (compliance.claimId !== payload.claimId) {
      throw new ForbiddenException(
        'El cumplimiento no pertenece a este reclamo',
      );
    }

    // Validar que el usuario es el responsable del compliance
    if (compliance.responsibleUserId !== payload.userId) {
      throw new ForbiddenException(
        'No autorizado para enviar evidencia de este cumplimiento',
      );
    }

    return await this.submitComplianceUseCase.execute({
      complianceId: compliance.id,
      userId: payload.userId,
      userNotes: payload.userNotes,
      evidenceUrls: payload.evidenceUrls,
    });
  }
}
