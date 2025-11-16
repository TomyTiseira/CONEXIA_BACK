import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateClaimDto {
  @IsOptional()
  @IsString({ message: 'La respuesta de subsanación debe ser un texto' })
  @MinLength(50, {
    message: 'La respuesta debe tener al menos 50 caracteres',
  })
  @MaxLength(2000, {
    message: 'La respuesta no puede exceder los 2000 caracteres',
  })
  clarificationResponse?: string;

  @IsOptional()
  evidenceUrls?: string[]; // Se llenará con los archivos subidos
}
