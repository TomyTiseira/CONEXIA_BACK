import { IsInt, IsNotEmpty, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateServiceReviewDto {
  @IsInt()
  @IsNotEmpty()
  hiringId: number;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @IsString()
  @MaxLength(500)
  @IsNotEmpty()
  comment: string;
}
