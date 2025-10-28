import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';

export enum CommentReportReason {
  CONTENT_OFFENSIVE = 'Contenido ofensivo o inapropiado',
  SPAM = 'Spam o contenido irrelevante',
  HARASSMENT = 'Acoso o intimidación',
  FALSE_INFORMATION = 'Información falsa',
  OTHER = 'Otro',
}

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
