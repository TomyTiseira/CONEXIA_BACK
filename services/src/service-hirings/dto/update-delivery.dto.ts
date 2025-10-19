import { IsOptional, IsString } from 'class-validator';

export class UpdateDeliveryDto {
  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  attachmentPath?: string; // Se setea desde el controller con el path del archivo
}
