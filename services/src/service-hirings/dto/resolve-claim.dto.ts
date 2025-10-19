import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ClaimResolutionType, ClaimStatus } from '../enums/claim.enum';

export class ResolveClaimDto {
  @IsNotEmpty({ message: 'El estado de resolución es obligatorio' })
  @IsEnum([ClaimStatus.RESOLVED, ClaimStatus.REJECTED], {
    message: 'El estado debe ser RESOLVED o REJECTED',
  })
  status: ClaimStatus.RESOLVED | ClaimStatus.REJECTED;

  @IsNotEmpty({ message: 'El tipo de resolución es obligatorio' })
  @IsEnum(ClaimResolutionType, {
    message:
      'El tipo de resolución debe ser "client_favor", "provider_favor" o "partial_agreement"',
  })
  resolutionType: ClaimResolutionType;

  @IsNotEmpty({ message: 'La resolución es obligatoria' })
  @IsString()
  @MinLength(20, {
    message: 'La resolución debe tener al menos 20 caracteres',
  })
  @MaxLength(2000, {
    message: 'La resolución no puede exceder 2000 caracteres',
  })
  resolution: string;

  // Campo opcional para acuerdos parciales (puede incluir monto parcial del pago, etc.)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  partialAgreementDetails?: string;
}
