import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePublicationDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  mediaFilename?: string;

  @IsOptional()
  @IsNumber()
  mediaSize?: number;

  @IsOptional()
  @IsString()
  mediaType?: string;
}
