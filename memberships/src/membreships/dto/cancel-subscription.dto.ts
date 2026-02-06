import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelSubscriptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
