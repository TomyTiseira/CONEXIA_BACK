import { IsOptional, IsString, MaxLength } from 'class-validator';

export class NegotiateServiceHiringDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'negotiationDescription must not exceed 1000 characters',
  })
  negotiationDescription?: string;
}
