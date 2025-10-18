import { Injectable } from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { ClaimResponseDto } from '../../dto/claim-response.dto';
import { GetClaimsDto } from '../../dto/get-claims.dto';
import { ClaimTypeLabels } from '../../enums/claim.enum';
import { ClaimRepository } from '../../repositories/claim.repository';

@Injectable()
export class GetClaimsUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(
    filters: GetClaimsDto,
  ): Promise<{ claims: ClaimResponseDto[]; total: number; pages: number }> {
    const { claims, total } =
      await this.claimRepository.findWithFilters(filters);

    // Buscar usuarios relacionados (claimantUserId) en batch para optimizar
    const claimantIds = Array.from(
      new Set(claims.map((c) => c.claimantUserId)),
    );
    const users =
      claimantIds.length > 0
        ? await this.usersClientService.getUsersByIds(claimantIds)
        : [];
    const usersMap = new Map<number, any>();
    users.forEach((u) => usersMap.set(u.id, u));

    const claimResponses = claims.map((claim) => {
      const claimTypeLabel = ClaimTypeLabels[claim.claimType];
      const user = usersMap.get(claim.claimantUserId);

      // Construir nombre completo
      const claimantFirstName =
        user?.profile?.firstName || user?.profile?.name || null;
      const claimantLastName = user?.profile?.lastName || null;
      const claimantName =
        claimantFirstName && claimantLastName
          ? `${claimantFirstName} ${claimantLastName}`
          : claimantFirstName || null;

      return ClaimResponseDto.fromEntity(claim, {
        claimTypeLabel,
        claimantName,
        claimantFirstName,
        claimantLastName,
      });
    });

    const pages = Math.ceil(total / (filters.limit || 10));

    return {
      claims: claimResponses,
      total,
      pages,
    };
  }

  async findByHiring(hiringId: number): Promise<ClaimResponseDto[]> {
    const claims = await this.claimRepository.findByHiringId(hiringId);

    // For single hiring, fetch claimant users as well
    const claimantIds = Array.from(
      new Set(claims.map((c) => c.claimantUserId)),
    );
    const users =
      claimantIds.length > 0
        ? await this.usersClientService.getUsersByIds(claimantIds)
        : [];
    const usersMap = new Map<number, any>();
    users.forEach((u) => usersMap.set(u.id, u));

    return claims.map((claim) => {
      const claimTypeLabel = ClaimTypeLabels[claim.claimType];
      const user = usersMap.get(claim.claimantUserId);

      // Construir nombre completo
      const claimantFirstName =
        user?.profile?.firstName || user?.profile?.name || null;
      const claimantLastName = user?.profile?.lastName || null;
      const claimantName =
        claimantFirstName && claimantLastName
          ? `${claimantFirstName} ${claimantLastName}`
          : claimantFirstName || null;

      return ClaimResponseDto.fromEntity(claim, {
        claimTypeLabel,
        claimantName,
        claimantFirstName,
        claimantLastName,
      });
    });
  }

  async findById(claimId: string): Promise<ClaimResponseDto | null> {
    const claim = await this.claimRepository.findById(claimId);

    if (!claim) {
      return null;
    }

    const claimTypeLabel = ClaimTypeLabels[claim.claimType];

    // Usar getUserByIdWithRelations para obtener el profile completo
    const user = await this.usersClientService.getUserByIdWithRelations(
      claim.claimantUserId,
    );

    // Construir nombre completo igual que en la lista
    const claimantFirstName =
      user?.profile?.firstName || user?.profile?.name || null;
    const claimantLastName = user?.profile?.lastName || null;
    const claimantName =
      claimantFirstName && claimantLastName
        ? `${claimantFirstName} ${claimantLastName}`
        : claimantFirstName || null;

    return ClaimResponseDto.fromEntity(claim, {
      claimTypeLabel,
      claimantName,
      claimantFirstName,
      claimantLastName,
    });
  }
}
