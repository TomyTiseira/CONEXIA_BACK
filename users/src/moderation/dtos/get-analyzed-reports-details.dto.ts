import { IsNumber } from 'class-validator';

export class GetAnalyzedReportsDetailsDto {
  @IsNumber()
  analysisId: number;
}
