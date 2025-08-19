import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ReportReason } from '../../common/enums/report-reason.enum';

export class CreateReportDto {
  @IsNumber({}, { message: 'projectId must be a number' })
  @IsNotEmpty({ message: 'projectId is required' })
  projectId: number;

  @IsEnum(ReportReason)
  @IsNotEmpty({ message: 'reason is required' })
  reason: ReportReason;

  @IsString({ message: 'otherReason must be a string' })
  @IsOptional()
  otherReason?: string;

  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description is required' })
  description: string;
}
