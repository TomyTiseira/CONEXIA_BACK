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
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @IsString({ message: 'Project must be a string' })
  @IsNotEmpty({ message: 'Project is required' })
  project: string;
}

class SocialLink {
  @IsString({ message: 'Platform must be a string' })
  @IsNotEmpty({ message: 'Platform is required' })
  platform: string;

  @IsString({ message: 'URL must be a string' })
  @IsUrl({}, { message: 'URL must be valid (e.g. https://example.com)' })
  url: string;
}

export class CreateProfileHttpDto {
  // Required fields
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsString({ message: 'Document number must be a string' })
  @IsNotEmpty({ message: 'Document number is required' })
  documentNumber: string;

  @IsNumber({}, { message: 'Document type must be a number' })
  @IsNotEmpty({ message: 'Document type ID is required' })
  documentTypeId: number;

  @IsPhoneNumber('AR', {
    message: 'Invalid phone number format (e.g. +5491122334455)',
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  phoneNumber: string;

  @IsString({ message: 'Country must be a string' })
  @IsNotEmpty({ message: 'Country is required' })
  country: string;

  @IsString({ message: 'State must be a string' })
  @IsNotEmpty({ message: 'State is required' })
  state: string;

  // Optional fields
  @IsDateString(undefined, {
    message: 'Birth date must be a valid ISO date (YYYY-MM-DD)',
  })
  @IsOptional()
  birthDate?: string;

  @IsString({ message: 'Profile picture must be a filename string' })
  @IsOptional()
  profilePicture?: string;

  @IsString({ message: 'Cover picture must be a filename string' })
  @IsOptional()
  coverPicture?: string;

  @IsArray({ message: 'Skills must be an array' })
  @ArrayMaxSize(20, { message: 'Skills cannot exceed 20 items' })
  @IsString({ each: true, message: 'Each skill must be a string' })
  @IsOptional()
  skills?: string[];

  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description cannot exceed 500 characters' })
  @IsOptional()
  description?: string;

  @IsArray({ message: 'Experience must be an array' })
  @ValidateNested({ each: true })
  @Type(() => ExperienceItem)
  @IsOptional()
  experience?: ExperienceItem[];

  @IsArray({ message: 'Social links must be an array' })
  @ValidateNested({ each: true })
  @Type(() => SocialLink)
  @IsOptional()
  socialLinks?: SocialLink[];
}
