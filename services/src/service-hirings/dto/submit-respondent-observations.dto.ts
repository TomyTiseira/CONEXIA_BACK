import { IsOptional, IsString, Length } from 'class-validator';

export class SubmitRespondentObservationsDto {
  @IsString()
  @Length(50, 2000)
  observations: string;

  @IsOptional()
  evidenceUrls?: string[] | null;
}
