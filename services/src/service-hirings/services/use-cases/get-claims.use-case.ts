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

    // Buscar usuarios relacionados (claimantUserId + resolvedBy + claimedUserId) en batch para optimizar
    const claimantIds = Array.from(
      new Set(claims.map((c) => c.claimantUserId)),
    );
    const resolverIds = Array.from(
      new Set(
        claims
          .filter((c) => c.resolvedBy !== null)
          .map((c) => c.resolvedBy as number),
      ),
    );
    // Agregar IDs de usuarios reclamados (cliente o proveedor según el rol)
    const claimedIds = Array.from(
      new Set(
        claims
          .filter((c) => c.hiring)
          .map((c) => {
            if (c.claimantRole === 'client') {
              return c.hiring?.service?.userId;
            } else if (c.claimantRole === 'provider') {
              return c.hiring?.userId;
            }
            return null;
          })
          .filter((id): id is number => id !== null),
      ),
    );
    const allUserIds = [...new Set([...claimantIds, ...resolverIds, ...claimedIds])];

    const users =
      allUserIds.length > 0
        ? await this.usersClientService.getUsersByIds(allUserIds)
        : [];
    const usersMap = new Map<number, any>();
    users.forEach((u) => usersMap.set(u.id, u));

    const claimResponses = claims.map((claim) => {
      const claimTypeLabel = ClaimTypeLabels[claim.claimType];
      const user = usersMap.get(claim.claimantUserId);

      // Construir nombre completo del reclamante
      const claimantFirstName =
        user?.profile?.firstName || user?.profile?.name || null;
      const claimantLastName = user?.profile?.lastName || null;
      const claimantName =
        claimantFirstName && claimantLastName
          ? `${claimantFirstName} ${claimantLastName}`
          : claimantFirstName || null;

      // Identificar usuario reclamado (según el rol del reclamante)
      let claimedUserId: number | null = null;
      let claimedUserName: string | null = null;
      let claimedUserFirstName: string | null = null;
      let claimedUserLastName: string | null = null;

      if (claim.hiring) {
        // Si el reclamante es cliente, el reclamado es el proveedor
        if (claim.claimantRole === 'client') {
          claimedUserId = claim.hiring.service?.userId || null;
        }
        // Si el reclamante es proveedor, el reclamado es el cliente
        else if (claim.claimantRole === 'provider') {
          claimedUserId = claim.hiring.userId || null;
        }

        // Buscar info del usuario reclamado
        if (claimedUserId) {
          const claimedUser = usersMap.get(claimedUserId);
          if (claimedUser) {
            claimedUserFirstName =
              claimedUser.profile?.firstName || claimedUser.profile?.name || null;
            claimedUserLastName = claimedUser.profile?.lastName || null;
            claimedUserName =
              claimedUserFirstName && claimedUserLastName
                ? `${claimedUserFirstName} ${claimedUserLastName}`
                : claimedUserFirstName || null;
          }
        }
      }

      // Información del moderador/admin que resolvió (solo prefijo del email)
      let resolvedByEmail: string | null = null;
      if (claim.resolvedBy) {
        const resolver = usersMap.get(claim.resolvedBy);
        if (resolver && resolver.email) {
          // Extraer solo el prefijo antes del @
          const emailPrefix = resolver.email.split('@')[0];
          resolvedByEmail = emailPrefix || null;
        }
      }

      return ClaimResponseDto.fromEntity(claim, {
        claimTypeLabel,
        claimantName,
        claimantFirstName,
        claimantLastName,
        claimedUserId,
        claimedUserName,
        claimedUserFirstName,
        claimedUserLastName,
        resolvedByEmail,
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
      const fullFirstName =
        user?.profile?.firstName || user?.profile?.name || null;
      // Extraer solo el primer nombre (primera palabra)
      const claimantFirstName = fullFirstName
        ? fullFirstName.split(' ')[0]
        : null;
      const claimantLastName = user?.profile?.lastName || null;
      const claimantName =
        fullFirstName && claimantLastName
          ? `${fullFirstName} ${claimantLastName}`
          : fullFirstName || null;

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

    // Usar getUserByIdWithRelations para obtener el profile completo del reclamante
    const user = await this.usersClientService.getUserByIdWithRelations(
      claim.claimantUserId,
    );

    // Construir nombre completo del reclamante
    const fullFirstName =
      user?.profile?.firstName || user?.profile?.name || null;
    // Extraer solo el primer nombre (primera palabra)
    const claimantFirstName = fullFirstName
      ? fullFirstName.split(' ')[0]
      : null;
    const claimantLastName = user?.profile?.lastName || null;
    const claimantName =
      fullFirstName && claimantLastName
        ? `${fullFirstName} ${claimantLastName}`
        : fullFirstName || null;

    // Identificar y buscar usuario reclamado
    let claimedUserId: number | null = null;
    let claimedUserName: string | null = null;
    let claimedUserFirstName: string | null = null;
    let claimedUserLastName: string | null = null;

    if (claim.hiring) {
      // Si el reclamante es cliente, el reclamado es el proveedor
      if (claim.claimantRole === 'client') {
        claimedUserId = claim.hiring.service?.userId || null;
      }
      // Si el reclamante es proveedor, el reclamado es el cliente
      else if (claim.claimantRole === 'provider') {
        claimedUserId = claim.hiring.userId || null;
      }

      // Buscar info del usuario reclamado
      if (claimedUserId) {
        const claimedUser = await this.usersClientService.getUserByIdWithRelations(
          claimedUserId,
        );
        if (claimedUser) {
          const fullClaimedFirstName =
            claimedUser.profile?.firstName || claimedUser.profile?.name || null;
          // Extraer solo el primer nombre (primera palabra)
          claimedUserFirstName = fullClaimedFirstName
            ? fullClaimedFirstName.split(' ')[0]
            : null;
          claimedUserLastName = claimedUser.profile?.lastName || null;
          claimedUserName =
            fullClaimedFirstName && claimedUserLastName
              ? `${fullClaimedFirstName} ${claimedUserLastName}`
              : fullClaimedFirstName || null;
        }
      }
    }

    // Información del moderador/admin que resolvió (solo prefijo del email)
    let resolvedByEmail: string | null = null;
    if (claim.resolvedBy) {
      const resolver = await this.usersClientService.getUserByIdWithRelations(
        claim.resolvedBy,
      );
      if (resolver && resolver.email) {
        // Extraer solo el prefijo antes del @
        const emailPrefix = resolver.email.split('@')[0];
        resolvedByEmail = emailPrefix || null;
      }
    }

    return ClaimResponseDto.fromEntity(claim, {
      claimTypeLabel,
      claimantName,
      claimantFirstName,
      claimantLastName,
      claimedUserId,
      claimedUserName,
      claimedUserFirstName,
      claimedUserLastName,
      resolvedByEmail,
    });
  }
}
