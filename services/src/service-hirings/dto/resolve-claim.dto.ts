import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
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
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ClaimResolutionType, ClaimStatus } from '../enums/claim.enum';
import { ComplianceType } from '../enums/compliance.enum';

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
  @IsEnum([ClaimStatus.RESOLVED, ClaimStatus.REJECTED], {
    message: 'El estado debe ser RESOLVED o REJECTED',
  })
  status: ClaimStatus.RESOLVED | ClaimStatus.REJECTED;

  @ValidateIf((dto: ResolveClaimDto) => dto.status === ClaimStatus.RESOLVED)
  @IsNotEmpty({ message: 'El tipo de resolución es obligatorio' })
  @IsEnum(ClaimResolutionType, {
    message:
      'El tipo de resolución debe ser "client_favor", "provider_favor" o "partial_agreement"',
  })
  resolutionType?: ClaimResolutionType;

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

  // Array de compliances que el moderador define
  @IsOptional()
  @IsArray({ message: 'compliances debe ser un array' })
  @ValidateNested({ each: true })
  @Type(() => CreateComplianceItemDto)
  @ArrayMaxSize(5, {
    message: 'No se pueden asignar más de 5 compliances por resolución',
  })
  compliances?: CreateComplianceItemDto[];
}
