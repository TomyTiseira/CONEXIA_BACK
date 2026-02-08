import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RespondServiceReviewDto {
  @IsString()
  @MaxLength(500)
  @IsNotEmpty()
  ownerResponse: string;
}
