import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

export enum ServiceReportReason {
  CONTENT_OFFENSIVE = 'Contenido ofensivo o inapropiado',
  FRAUDULENT_SERVICE = 'Servicio engañoso o fraudulento',
  FALSE_INFORMATION = 'Información falsa',
  OTHER = 'Otro',
}

export class CreateServiceReportDto {
  @IsNumber()
  @IsNotEmpty()
  serviceId: number;

  @IsEnum(ServiceReportReason)
  @IsNotEmpty()
  reason: ServiceReportReason;

  @ValidateIf((o) => o.reason === ServiceReportReason.OTHER)
  @IsString()
  @IsNotEmpty()
  otherReason?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
