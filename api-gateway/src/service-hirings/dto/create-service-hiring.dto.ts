import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateServiceHiringDto {
  @IsNotEmpty()
  serviceId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  description: string;
}
