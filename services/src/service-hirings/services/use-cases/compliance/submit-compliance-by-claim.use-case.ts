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
    userId: string;
    userNotes?: string;
    evidenceUrls?: string[];
  }) {
    const claim = await this.claimRepository.findById(payload.claimId);
    if (!claim) {
      throw new NotFoundException(
        `Reclamo con ID ${payload.claimId} no encontrado`,
      );
    }

    // Buscar compliance del claim cuyo responsable sea el usuario
    const compliances = await this.complianceRepository.findByClaimId(
      payload.claimId,
    );
    const compliance = compliances.find(
      (c) => c.responsibleUserId === payload.userId,
    );

    if (!compliance) {
      throw new NotFoundException(
        'No hay un cumplimiento asignado a este usuario para este reclamo',
      );
    }

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
