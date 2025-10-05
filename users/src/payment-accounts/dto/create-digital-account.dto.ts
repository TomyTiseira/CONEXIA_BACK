import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDigitalAccountDto {
  @IsNumber()
  @IsNotEmpty()
  digitalPlatformId: number;

  @IsString()
  @IsNotEmpty()
  cvu: string;

  @IsString()
  @IsNotEmpty()
  alias: string;

  @IsString()
  @IsOptional()
  customName?: string;

  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @IsString()
  @IsNotEmpty()
  cuilCuit: string;
}
