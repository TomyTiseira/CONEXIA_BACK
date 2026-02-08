import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateUserReviewDto {
  @IsInt()
  @Min(1)
  reviewedUserId: number;

  @IsInt()
  @Min(1)
  reviewerUserId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  relationship: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
