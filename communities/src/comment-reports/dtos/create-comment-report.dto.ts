import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';
import { CommentReportReason } from '../enums/comment-report-reason.enum';

export class CreateCommentReportDto {
  @IsNumber()
  @IsNotEmpty()
  commentId: number;

  @IsEnum(CommentReportReason)
  @IsNotEmpty()
  reason: CommentReportReason;

  @ValidateIf((o) => o.reason === CommentReportReason.OTHER)
  @IsString()
  @IsNotEmpty()
  otherReason?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
