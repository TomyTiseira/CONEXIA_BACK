import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class ExperienceItem {
  @IsString()
  title: string;

  @IsString()
  project: string;
}

class SocialLink {
  @IsString()
  platform: string;

  @IsString()
  url: string;
}

export class CreateProfileDto {
  // Campos obligatorios (según tu entidad)
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  documentNumber: string;

  @IsNumber()
  @IsNotEmpty()
  documentTypeId: number;

  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  // Campos opcionales
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  coverPicture?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  @IsOptional()
  skills?: string[];

  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItem)
  @IsOptional()
  experience?: ExperienceItem[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLink)
  @IsOptional()
  socialLinks?: SocialLink[];
}
