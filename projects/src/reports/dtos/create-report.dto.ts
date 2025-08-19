import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ReportReason } from '../../common/enums/report-reason.enum';

export class CreateReportDto {
  @IsNumber()
  @IsNotEmpty()
  projectId: number;

  @IsEnum(ReportReason)
  @IsNotEmpty()
  reason: ReportReason;

  @ValidateIf((o) => o.reason === ReportReason.OTHER)
  @IsString()
  @IsNotEmpty()
  otherReason?: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
