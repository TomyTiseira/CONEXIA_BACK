import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateClaimDto {
  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  @MinLength(50, {
    message: 'La descripción debe tener al menos 50 caracteres',
  })
  @MaxLength(2000, {
    message: 'La descripción no puede exceder los 2000 caracteres',
  })
  description?: string;

  @IsOptional()
  evidenceUrls?: string[]; // Se llenará con los archivos subidos
}
