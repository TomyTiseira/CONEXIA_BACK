import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReviewAction {
  APPROVE = 'approve',
  REQUEST_REVISION = 'request_revision',
}

export class ReviewDeliveryDto {
  @IsEnum(ReviewAction)
  action: ReviewAction;

  @IsOptional()
  @IsString()
  notes?: string; // Obligatorio si action es REQUEST_REVISION
}
