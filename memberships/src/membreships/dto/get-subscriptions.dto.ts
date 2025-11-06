import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { SubscriptionStatus } from '../entities/membreship.entity';

export class GetSubscriptionsDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @IsPositive()
  limit?: number = 10;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsInt()
  @IsPositive()
  userId?: number;
}
