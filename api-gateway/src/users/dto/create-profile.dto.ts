import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
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
  @IsNotEmpty({ message: 'url is required' })
  url: string;
}

export class CreateProfileHttpDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name: string;

  @IsString({ message: 'lastName must be a string' })
  @IsNotEmpty({ message: 'lastName is required' })
  lastName: string;

  @IsDateString({}, { message: 'birthDate must be a valid ISO date string' })
  @IsNotEmpty({ message: 'birthDate is required' })
  birthDate: string;

  @IsOptional()
  @ArrayMaxSize(20, { message: 'skills can have at most 20 items' })
  @IsString({ each: true, message: 'each skill must be a string' })
  skills?: string[];

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(500, { message: 'description can be max 500 characters' })
  description?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExperienceItem)
  experience?: ExperienceItem[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SocialLink)
  socialLinks?: SocialLink[];
}