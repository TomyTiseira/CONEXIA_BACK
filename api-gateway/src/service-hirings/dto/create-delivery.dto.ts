import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDeliveryDto {
  @IsString()
  @MinLength(10, { message: 'El contenido debe tener al menos 10 caracteres' })
  content: string;

  @IsOptional()
  @IsNumber()
  deliverableId?: number; // Solo para entregas por entregables
}
