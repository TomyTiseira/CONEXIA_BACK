import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

export enum PublicationReportReason {
  CONTENT_OFFENSIVE = 'Contenido ofensivo o inapropiado',
  FRAUDULENT_PROJECT = 'Proyecto engañoso o fraudulento',
  FALSE_INFORMATION = 'Información falsa',
  OTHER = 'Otro',
}

export class CreatePublicationReportDto {
  @IsNumber()
  @IsNotEmpty()
  publicationId: number;

  @IsEnum(PublicationReportReason)
  @IsNotEmpty()
  reason: PublicationReportReason;

  @ValidateIf((o) => o.reason === PublicationReportReason.OTHER)
  @IsString()
  @IsNotEmpty()
  otherReason?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
