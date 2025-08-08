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
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  })
  endDate?: string;

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

class EducationItem {
  @IsString({ message: 'institution must be a string' })
  @IsNotEmpty({ message: 'institution is required' })
  institution: string;

  @IsString({ message: 'title must be a string' })
  @IsNotEmpty({ message: 'title is required' })
  title: string;

  @IsDateString(undefined, {
    message: 'startDate must be a valid ISO date (YYYY-MM-DD)',
  })
  @IsNotEmpty({ message: 'startDate is required' })
  startDate: string;

  @IsDateString(undefined, {
    message: 'endDate must be a valid ISO date (YYYY-MM-DD)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return value;
  })
  endDate?: string;

  @IsBoolean({ message: 'isCurrent must be a boolean' })
  @IsNotEmpty({ message: 'isCurrent is required' })
  isCurrent: boolean;
}

class Certification {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString({ message: 'url must be a string' })
  @IsNotEmpty({ message: 'url is required' })
  url: string;
}

export class UpdateProfileHttpDto {
  @IsString({ message: 'name must be a string' })
  @IsOptional()
  name?: string;

  @IsString({ message: 'lastName must be a string' })
  @IsOptional()
  lastName?: string;

  @IsString({ message: 'profession must be a string' })
  @IsOptional()
  profession?: string;

  @IsPhoneNumber('AR', { message: 'phoneNumber must be a valid phone number' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    return value;
  })
  phoneNumber?: string;

  @IsString({ message: 'country must be a string' })
  @IsOptional()
  country?: string;

  @IsString({ message: 'state must be a string' })
  @IsOptional()
  state?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        // Intentar parsear como JSON primero
        return JSON.parse(value);
      } catch {
        // Si falla, intentar separar por comas
        return value.split(',');
      }
    }
    return value;
  })
  @IsArray()
  @IsNumber({}, { each: true, message: 'each skill must be a number' })
  @ArrayMaxSize(20, { message: 'skills must have at most 20 items' })
  @IsOptional()
  @Transform(({ value }) => value.map((v: string) => Number(v)))
  skills?: number[];

  @IsString({ message: 'description must be a string' })
  @MaxLength(500, { message: 'description must have at most 500 characters' })
  @IsOptional()
  description?: string;

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
  @IsArray()
  @ValidateNested({
    each: true,
    message: 'experience must be an array of objects',
  })
  @Type(() => ExperienceItem)
  @IsOptional()
  experience?: ExperienceItem[];

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
  @IsArray()
  @ValidateNested({
    each: true,
    message: 'socialLinks must be an array of objects',
  })
  @Type(() => SocialLink)
  @IsOptional()
  socialLinks?: SocialLink[];

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
  @IsArray()
  @ValidateNested({
    each: true,
    message: 'education must be an array of objects',
  })
  @Type(() => EducationItem)
  @IsOptional()
  education?: EducationItem[];

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
  @IsArray()
  @ValidateNested({
    each: true,
    message: 'certifications must be an array of objects',
  })
  @Type(() => Certification)
  @IsOptional()
  certifications?: Certification[];
}
