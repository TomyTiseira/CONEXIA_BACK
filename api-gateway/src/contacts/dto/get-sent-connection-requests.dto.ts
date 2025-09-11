import { IsNumber, IsOptional } from 'class-validator';

export class GetSentConnectionRequestsDto {
  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'limit must be a number' },
  )
  limit?: number;

  @IsOptional()
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'page must be a number' },
  )
  page?: number;
}
