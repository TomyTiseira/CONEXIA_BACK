import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsString,
    ValidateIf,
} from 'class-validator';
import { UserReviewReportReason } from '../enums/user-review-report-reason.enum';

export class CreateUserReviewReportDto {
  @IsNumber()
  @IsNotEmpty()
  userReviewId: number;

  @IsEnum(UserReviewReportReason)
  @IsNotEmpty()
  reason: UserReviewReportReason;

  @ValidateIf((o) => o.reason === UserReviewReportReason.OTHER)
  @IsString()
  @IsNotEmpty()
  otherReason?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
