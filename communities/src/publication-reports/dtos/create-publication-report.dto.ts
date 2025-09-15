import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';
import { PublicationReportReason } from '../enums/publication-report-reason.enum';

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
