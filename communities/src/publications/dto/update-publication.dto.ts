import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PublicationPrivacy } from '../enums/privacy.enum';
import { MediaFileDto } from './media-file.dto';

export class UpdatePublicationDto {
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'media must be an array' })
  @ValidateNested({ each: true })
  @Type(() => MediaFileDto)
  media?: MediaFileDto[];

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray({ message: 'removeMediaIds must be an array of numbers' })
  @IsNumber({}, { each: true, message: 'each removeMediaId must be a number' })
  removeMediaIds?: number[];

  // Campos legacy para compatibilidad temporal
  @IsOptional()
  @IsString({ message: 'mediaUrl must be a string' })
  mediaUrl?: string;

  @IsOptional()
  @IsString({ message: 'mediaFilename must be a string' })
  mediaFilename?: string;

  @IsOptional()
  @IsNumber({}, { message: 'mediaSize must be a number' })
  mediaSize?: number;

  @IsOptional()
  @IsString({ message: 'mediaType must be a string' })
  mediaType?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'removeMedia must be a boolean value' })
  removeMedia?: boolean;

  @IsOptional()
  @IsIn(Object.values(PublicationPrivacy), {
    message: 'privacy must be public or onlyFriends',
  })
  privacy?: PublicationPrivacy;
}
