import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum ClaimType {
  // Cliente
  NOT_DELIVERED = 'not_delivered',
  OFF_AGREEMENT = 'off_agreement',
  DEFECTIVE_DELIVERY = 'defective_delivery',
  CLIENT_OTHER = 'client_other',

  // Proveedor
  PAYMENT_NOT_RECEIVED = 'payment_not_received',
  PROVIDER_OTHER = 'provider_other',
}

export class CreateClaimDto {
  @IsString()
  hiringId: string;

  @IsEnum(ClaimType, {
    message: 'Tipo de reclamo inválido',
  })
  claimType: ClaimType;

  @IsString()
  @MinLength(50, {
    message: 'La descripción debe tener al menos 50 caracteres',
  })
  @MaxLength(2000, {
    message: 'La descripción no puede exceder 2000 caracteres',
  })
  description: string;

  // Campo opcional, requerido solo cuando claimType es *_other
  @ValidateIf(
    (o) =>
      o.claimType === ClaimType.CLIENT_OTHER ||
      o.claimType === ClaimType.PROVIDER_OTHER,
  )
  @IsString()
  @IsNotEmpty({
    message: 'El campo "otherReason" es requerido cuando el motivo es "Otro"',
  })
  @MaxLength(30, {
    message: 'El motivo especificado no puede exceder 30 caracteres',
  })
  otherReason?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, {
    message: 'No se pueden subir más de 10 archivos de evidencia',
  })
  @IsString({ each: true })
  evidenceUrls?: string[];
}
