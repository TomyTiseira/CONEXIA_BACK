import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum ClaimResolutionStatus {
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum ClaimResolutionType {
  CLIENT_FAVOR = 'client_favor',
  PROVIDER_FAVOR = 'provider_favor',
  PARTIAL_AGREEMENT = 'partial_agreement',
}

export class ResolveClaimDto {
  @IsNotEmpty({ message: 'El estado de resolución es obligatorio' })
  @IsEnum(ClaimResolutionStatus, {
    message: 'El estado debe ser RESOLVED o REJECTED',
  })
  status: ClaimResolutionStatus;

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

  // Campo opcional para acuerdos parciales
  @IsOptional()
  @IsString()
  @MaxLength(500)
  partialAgreementDetails?: string;
}
