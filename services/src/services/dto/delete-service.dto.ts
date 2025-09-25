import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteServiceDto {
  @IsNotEmpty({ message: 'El motivo de baja es obligatorio' })
  @IsString({ message: 'El motivo de baja debe ser un texto' })
  reason: string;
}
