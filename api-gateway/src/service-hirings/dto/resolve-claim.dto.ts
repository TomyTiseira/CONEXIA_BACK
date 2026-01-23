import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ClaimResolutionStatus {
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum ClaimResolutionType {
  CLIENT_FAVOR = 'client_favor',
  PROVIDER_FAVOR = 'provider_favor',
  PARTIAL_AGREEMENT = 'partial_agreement',
}

export enum ComplianceType {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
  PAYMENT_REQUIRED = 'payment_required',
  WORK_COMPLETION = 'work_completion',
  WORK_REVISION = 'work_revision',
  APOLOGY_REQUIRED = 'apology_required',
  SERVICE_DISCOUNT = 'service_discount',
  PENALTY_FEE = 'penalty_fee',
  ACCOUNT_RESTRICTION = 'account_restriction',
  CONFIRMATION_ONLY = 'confirmation_only',
  OTHER = 'other',
}

/**
 * DTO para definir un compliance individual al resolver un reclamo
 */
export class CreateComplianceItemDto {
  @IsNotEmpty({ message: 'El ID del usuario responsable es obligatorio' })
  @IsInt({ message: 'El ID del usuario debe ser un número entero' })
  @IsPositive({ message: 'El ID del usuario debe ser positivo' })
  responsibleUserId: number;

  @IsNotEmpty({ message: 'El tipo de compliance es obligatorio' })
  @IsEnum(ComplianceType, {
    message: 'El tipo de compliance no es válido',
  })
  complianceType: ComplianceType;

  @IsNotEmpty({ message: 'Las instrucciones son obligatorias' })
  @IsString()
  @MinLength(20, {
    message: 'Las instrucciones deben tener al menos 20 caracteres',
  })
  @MaxLength(2000, {
    message: 'Las instrucciones no pueden exceder 2000 caracteres',
  })
  instructions: string;

  @IsNotEmpty({ message: 'Los días de plazo son obligatorios' })
  @IsInt({ message: 'Los días de plazo deben ser un número entero' })
  @Min(1, { message: 'El plazo debe ser al menos 1 día' })
  @Max(90, { message: 'El plazo no puede exceder 90 días' })
  deadlineDays: number;

  @IsOptional()
  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(0, { message: 'El orden no puede ser negativo' })
  order?: number;
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

  // Array de compliances que el moderador define
  @IsOptional()
  @IsArray({ message: 'compliances debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateComplianceItemDto)
  @Max(5, {
    message: 'No se pueden asignar más de 5 compliances por resolución',
  })
  compliances?: CreateComplianceItemDto[];
}
