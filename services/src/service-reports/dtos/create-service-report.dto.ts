import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ServiceReportReason } from '../enums/service-report-reason.enum';

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
