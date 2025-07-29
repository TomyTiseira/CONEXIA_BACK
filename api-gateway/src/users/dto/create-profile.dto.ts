import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
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

  @IsDateString(undefined, {
    message: 'startDate must be a valid ISO date (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'startDate is required' })
  startDate: string;

  @IsDateString(undefined, {
    message: 'endDate must be a valid ISO date (YYYY-MM-DD)',
  })
  @IsOptional()
  endDate: string;

  @IsBoolean({ message: 'isCurrent must be a boolean' })
  @IsNotEmpty({ message: 'isCurrent is required' })
  isCurrent: boolean;
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
  @Type(() => Number)
  documentTypeId: number;

  @IsPhoneNumber('AR', { message: 'phoneNumber must be a valid phone number' })
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
  @IsNumber({}, { each: true, message: 'each skill must be a number' })
  @IsOptional()
  @Transform(({ value }) => value.map((v: string) => Number(v)))
  skills?: number[];

  @IsString({ message: 'description must be a string' })
  @MaxLength(500, { message: 'description cannot exceed 500 characters' })
  @IsOptional()
  description?: string;

  @IsArray({ message: 'experience must be an array' })
  @ValidateNested({ each: true, message: 'each experience must be an object' })
  @Type(() => ExperienceItem)
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  experience?: ExperienceItem[];

  @IsArray({ message: 'socialLinks must be an array' })
  @ValidateNested({ each: true, message: 'each socialLink must be an object' })
  @Type(() => SocialLink)
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }
    return value;
  })
  socialLinks?: SocialLink[];
}
