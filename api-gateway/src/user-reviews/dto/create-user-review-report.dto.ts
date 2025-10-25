import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsString,
    ValidateIf,
} from 'class-validator';

export enum UserReviewReportReason {
  SPAM = 'Spam',
  HARASSMENT = 'Acoso',
  CONTENT_OFFENSIVE = 'Contenido ofensivo',
  FALSE_INFORMATION = 'Información falsa',
  OTHER = 'Otro',
}

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
