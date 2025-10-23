import {
    ClaimResolutionType,
    ClaimRole,
    ClaimStatus,
    ClaimType,
} from '../enums/claim.enum';

export class ClaimResponseDto {
  id: string;
  hiringId: number;
  claimantUserId: number;
  claimantRole: ClaimRole;
  claimType: ClaimType;
  description: string;
  otherReason?: string | null;
  evidenceUrls: string[];
  status: ClaimStatus;
  observations: string | null;
  observationsBy: number | null;
  observationsAt: Date | null;
  resolution: string | null;
  resolutionType: ClaimResolutionType | null;
  partialAgreementDetails: string | null;
  resolvedBy: number | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  // Información adicional para el frontend
  claimTypeLabel?: string;
  claimantName?: string;
  claimantFirstName?: string;
  claimantLastName?: string;
  hiringTitle?: string;

  // Objeto hiring completo (para validaciones de permisos en frontend)
  hiring?: {
    id: number;
    status?: {
      id: number;
      name: string;
      code: string;
    };
    userId: number; // clientId
    service?: {
      id: number;
      title: string;
      userId: number; // ownerId/providerId
    };
  };

  static fromEntity(claim: any, additionalInfo?: any): ClaimResponseDto {
    const dto = new ClaimResponseDto();
    dto.id = claim.id;
    dto.hiringId = claim.hiringId;
    dto.claimantUserId = claim.claimantUserId;
    dto.claimantRole = claim.claimantRole;
    dto.claimType = claim.claimType;
    dto.description = claim.description;
  dto.otherReason = claim.otherReason ?? null;
    dto.evidenceUrls = claim.evidenceUrls || [];
    dto.status = claim.status;
    dto.observations = claim.observations;
    dto.observationsBy = claim.observationsBy;
    dto.observationsAt = claim.observationsAt;
    dto.resolution = claim.resolution;
    dto.resolutionType = claim.resolutionType;
    dto.partialAgreementDetails = claim.partialAgreementDetails;
    dto.resolvedBy = claim.resolvedBy;
    dto.resolvedAt = claim.resolvedAt;
    dto.createdAt = claim.createdAt;
    dto.updatedAt = claim.updatedAt;

    // Mapear hiring si está cargado (con relaciones)
    if (claim.hiring) {
      dto.hiring = {
        id: claim.hiring.id,
        status: claim.hiring.status
          ? {
              id: claim.hiring.status.id,
              name: claim.hiring.status.name,
              code: claim.hiring.status.code,
            }
          : undefined,
        userId: claim.hiring.userId, // clientId
        service: claim.hiring.service
          ? {
              id: claim.hiring.service.id,
              title: claim.hiring.service.title,
              userId: claim.hiring.service.userId, // ownerId/providerId
            }
          : undefined,
      };
    }

    if (additionalInfo) {
      dto.claimTypeLabel = additionalInfo.claimTypeLabel;
      dto.claimantName = additionalInfo.claimantName;
      dto.claimantFirstName = additionalInfo.claimantFirstName;
      dto.claimantLastName = additionalInfo.claimantLastName;
      dto.hiringTitle = additionalInfo.hiringTitle;
    }

    return dto;
  }
}
