import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PublicationPrivacy } from '../enums/privacy.enum';

export class UpdatePublicationDto {
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string;

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
  @IsIn(Object.values(PublicationPrivacy), {
    message: 'privacy must be public or onlyFriends',
  })
  privacy?: PublicationPrivacy;
}
