import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ClaimType } from '../enums/claim.enum';

export class CreateClaimDto {
  @IsString()
  hiringId: string; // Se recibe como string del frontend, se convierte a number en el use case

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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, {
    message: 'No se pueden subir más de 10 archivos de evidencia',
  })
  @IsString({ each: true })
  evidenceUrls?: string[];
}
