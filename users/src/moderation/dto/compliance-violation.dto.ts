import { IsInt, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para suspender/banear usuarios por violación de compliance
 */
export class SuspendForComplianceDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  complianceId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsInt()
  @IsNotEmpty()
  days: number;

  @IsString()
  @IsNotEmpty()
  moderatorId: string;
}

export class BanForComplianceDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  complianceId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsNotEmpty()
  moderatorId: string;
}
