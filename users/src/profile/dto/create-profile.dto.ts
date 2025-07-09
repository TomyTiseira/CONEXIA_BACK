import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    IsDateString, IsNotEmpty, IsOptional, IsString,
    MaxLength,
    ValidateNested
} from 'class-validator';

class ExperienceItem {
  @IsString() title: string;
  @IsString() project: string;
}

class SocialLink {
  @IsString() platform: string;
  @IsString() url: string;
}

export class CreateProfileDto {
  @IsNotEmpty() userId: number;

  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() lastName: string;

  @IsDateString() @IsNotEmpty()
  birthDate: string;

  @IsOptional() @IsString()
  profilePicture?: string;

  @IsOptional() @IsString()
  coverPicture?: string;

  @IsOptional() @ArrayMaxSize(20) @IsString({ each: true })
  skills?: string[];

  @IsOptional() @MaxLength(500)
  description?: string;

  @IsOptional() @ValidateNested({ each: true })
  @Type(() => ExperienceItem)
  experience?: ExperienceItem[];

  @IsOptional() @ValidateNested({ each: true })
  @Type(() => SocialLink)
  socialLinks?: SocialLink[];
}