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
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class ExperienceItem {
  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title: string;

  @IsString({ message: 'project must be a string' })
  @IsNotEmpty({ message: 'project is required' })
  project: string;
}

class SocialLink {
  @IsString({ message: 'platform must be a string' })
  @IsNotEmpty({ message: 'platform is required' })
  platform: string;

  @IsString({ message: 'url must be a string' })
  @IsUrl({}, { message: 'url must be valid (e.g. https://example.com)' })
  url: string;
}

export class CreateProfileHttpDto {
  // Required fields
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString({ message: 'lastName must be a string' })
  @IsNotEmpty({ message: 'lastName is required' })
  lastName: string;

  @IsString({ message: 'documentNumber must be a string' })
  @IsNotEmpty({ message: 'documentNumber is required' })
  documentNumber: string;

  @IsNumber({}, { message: 'documentTypeId must be a number' })
  @IsNotEmpty({ message: 'documentTypeId is required' })
  documentTypeId: number;

  @IsPhoneNumber('AR', {
    message: 'Invalid phone number format (e.g. +5491122334455)',
  })
  @IsOptional()
  phoneNumber: string;

  @IsString({ message: 'country must be a string' })
  @IsOptional()
  country: string;

  @IsString({ message: 'state must be a string' })
  @IsOptional()
  state: string;

  // Optional fields
  @IsDateString(undefined, {
    message: 'birthDate must be a valid ISO date (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'birthDate is required' })
  birthDate: string;

  @IsString({ message: 'profilePicture must be a filename string' })
  @IsOptional()
  profilePicture?: string;

  @IsString({ message: 'coverPicture must be a filename string' })
  @IsOptional()
  coverPicture?: string;

  @IsArray({ message: 'skills must be an array' })
  @ArrayMaxSize(20, { message: 'skills cannot exceed 20 items' })
  @IsString({ each: true, message: 'each skill must be a string' })
  @IsOptional()
  skills?: string[];

  @IsString({ message: 'description must be a string' })
  @MaxLength(500, { message: 'description cannot exceed 500 characters' })
  @IsOptional()
  description?: string;

  @IsArray({ message: 'experience must be an array' })
  @ValidateNested({ each: true, message: 'each experience must be an object' })
  @Type(() => ExperienceItem)
  @IsOptional()
  experience?: ExperienceItem[];

  @IsArray({ message: 'socialLinks must be an array' })
  @ValidateNested({
    each: true,
    message: 'each socialLink must be an object',
  })
  @Type(() => SocialLink)
  @IsOptional()
  socialLinks?: SocialLink[];
}
