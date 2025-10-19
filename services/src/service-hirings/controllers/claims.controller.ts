import { Controller, NotFoundException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ClaimResponseDto } from '../dto/claim-response.dto';
import { CreateClaimDto } from '../dto/create-claim.dto';
import { GetClaimsDto } from '../dto/get-claims.dto';
import { ResolveClaimDto } from '../dto/resolve-claim.dto';
import { CreateClaimUseCase } from '../services/use-cases/create-claim.use-case';
import { GetClaimsUseCase } from '../services/use-cases/get-claims.use-case';
import { ResolveClaimUseCase } from '../services/use-cases/resolve-claim.use-case';

/**
 * Controlador de Reclamos (Claims) - NATS Microservice
 *
 * Message Patterns:
 * - createClaim - Crear un nuevo reclamo
 * - getClaims - Listar reclamos con filtros
 * - getClaimsByHiring - Obtener reclamos de una contratación
 * - getClaimById - Obtener un reclamo específico
 * - resolveClaim - Resolver un reclamo
 * - markClaimAsInReview - Marcar como "en revisión"
 */
@Controller()
export class ClaimsController {
  constructor(
    private readonly createClaimUseCase: CreateClaimUseCase,
    private readonly getClaimsUseCase: GetClaimsUseCase,
    private readonly resolveClaimUseCase: ResolveClaimUseCase,
  ) {}

  @MessagePattern('createClaim')
  async createClaim(
    @Payload() data: { userId: number; createClaimDto: CreateClaimDto },
  ) {
    const claim = await this.createClaimUseCase.execute(
      data.userId,
      data.createClaimDto,
    );
    return ClaimResponseDto.fromEntity(claim);
  }

  @MessagePattern('getClaims')
  async getClaims(@Payload() filters: GetClaimsDto) {
    return await this.getClaimsUseCase.execute(filters);
  }

  @MessagePattern('getClaimsByHiring')
  async getClaimsByHiring(@Payload() data: { hiringId: number }) {
    return await this.getClaimsUseCase.findByHiring(data.hiringId);
  }

  @MessagePattern('getClaimById')
  async getClaimById(@Payload() data: { claimId: string }) {
    const claim = await this.getClaimsUseCase.findById(data.claimId);

    if (!claim) {
      throw new NotFoundException(
        `Reclamo con ID ${data.claimId} no encontrado`,
      );
    }

    return claim;
  }

  @MessagePattern('resolveClaim')
  async resolveClaim(
    @Payload()
    data: {
      claimId: string;
      resolvedBy: number;
      resolveDto: ResolveClaimDto;
    },
  ) {
    const claim = await this.resolveClaimUseCase.execute(
      data.claimId,
      data.resolvedBy,
      data.resolveDto,
    );
    return ClaimResponseDto.fromEntity(claim);
  }

  @MessagePattern('markClaimAsInReview')
  async markAsInReview(@Payload() data: { claimId: string }) {
    const claim = await this.resolveClaimUseCase.markAsInReview(data.claimId);
    return ClaimResponseDto.fromEntity(claim);
  }
}
