import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateDigitalAccountDto {
  @IsNumber()
  @IsNotEmpty()
  digitalPlatformId: number;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => !o.alias)
  cvu: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.cvu)
  alias?: string;

  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @IsString()
  @IsNotEmpty()
  cuilCuit: string;
}
