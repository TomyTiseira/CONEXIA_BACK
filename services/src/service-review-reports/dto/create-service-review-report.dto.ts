import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsString,
    MaxLength,
    ValidateIf,
} from 'class-validator';
import { ServiceReviewReportReason } from '../enums/service-review-report-reason.enum';

export class CreateServiceReviewReportDto {
  @IsNumber()
  @IsNotEmpty({ message: 'serviceReviewId is required' })
  serviceReviewId: number;

  @IsEnum(ServiceReviewReportReason, { message: 'Invalid report reason' })
  @IsNotEmpty({ message: 'reason is required' })
  reason: ServiceReviewReportReason;

  @ValidateIf((o) => o.reason === ServiceReviewReportReason.OTHER)
  @IsString({ message: 'otherReason must be a string' })
  @IsNotEmpty({ message: 'otherReason is required when reason is "Other"' })
  @MaxLength(30, {
    message: 'otherReason must not exceed 30 characters',
  })
  otherReason?: string;

  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description is required' })
  @MaxLength(500, { message: 'description must not exceed 500 characters' })
  description: string;
}
