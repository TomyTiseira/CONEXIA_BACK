import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PublicationPrivacy } from '../enums/privacy.enum';
import { MediaFileDto } from './media-file.dto';

export class CreatePublicationDto {
  @IsNotEmpty({ message: 'description is required' })
  @IsString({ message: 'description must be a string' })
  description: string;

  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber({}, { message: 'userId must be a number' })
  userId: number;

  @IsOptional()
  @IsArray({ message: 'media must be an array' })
  @ValidateNested({ each: true })
  @Type(() => MediaFileDto)
  media?: MediaFileDto[];

  // Campos legacy para compatibilidad temporal
  @IsOptional()
  @IsString({ message: 'mediaFilename must be a string' })
  mediaFilename?: string;

  @IsOptional()
  @IsNumber({}, { message: 'mediaSize must be a number' })
  mediaSize?: number;

  @IsOptional()
  @IsIn(['image', 'video', 'gif'], {
    message: 'mediaType must be image, video or gif',
  })
  mediaType?: string;

  @IsOptional()
  @IsString({ message: 'mediaUrl must be a string' })
  mediaUrl?: string;

  @IsOptional()
  @IsIn(Object.values(PublicationPrivacy), {
    message: 'privacy must be either public or onlyFriends',
  })
  privacy?: PublicationPrivacy;
}
