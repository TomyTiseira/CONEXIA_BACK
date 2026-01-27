import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubmitRespondentObservationsDto } from '../../dto/submit-respondent-observations.dto';
import { ClaimStatus } from '../../enums/claim.enum';
import { ClaimRepository } from '../../repositories/claim.repository';

@Injectable()
export class SubmitRespondentObservationsUseCase {
  constructor(private readonly claimRepository: ClaimRepository) {}

  async execute(
    claimId: string,
    userId: number,
    dto: SubmitRespondentObservationsDto,
  ) {
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${claimId} no encontrado`);
    }

    const isRespondent = this.claimRepository.isUserRespondentOfClaim(
      claim,
      userId,
    );
    if (!isRespondent) {
      throw new ForbiddenException(
        'Solo el reclamado puede enviar observaciones',
      );
    }

    if (claim.status !== ClaimStatus.OPEN) {
      throw new BadRequestException(
        'Solo se pueden enviar observaciones si el reclamo está pendiente',
      );
    }

    await this.claimRepository.setRespondentObservations(claimId, {
      respondentObservations: dto.observations,
      respondentEvidenceUrls: dto.evidenceUrls || [],
      respondentObservationsBy: userId,
      respondentObservationsAt: new Date(),
      status: ClaimStatus.IN_REVIEW,
    });

    const updated = await this.claimRepository.findById(claimId);
    if (!updated) {
      throw new Error('Error al actualizar observaciones');
    }

    return updated;
  }
}
