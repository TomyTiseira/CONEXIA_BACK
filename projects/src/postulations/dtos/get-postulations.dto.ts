import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetPostulationsDto {
  @IsNumber()
  projectId: number;

  @IsOptional()
  @IsNumber()
  statusId?: number;

  @IsOptional()
  @IsNumber()
  roleId?: number;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'page must be greater than 0' })
  page?: number;

  @IsNumber()
  @IsOptional()
  @Min(1, { message: 'limit must be greater than 0' })
  limit?: number;
}
