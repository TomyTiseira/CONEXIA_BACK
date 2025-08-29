import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { PublicationPrivacy } from '../enums/privacy.enum';

export class UpdatePublicationDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  mediaFilename?: string;

  @IsOptional()
  @IsNumber()
  mediaSize?: number;

  @IsOptional()
  @IsString()
  mediaType?: string;

  @IsOptional()
  @IsIn(Object.values(PublicationPrivacy), {
    message: 'privacy must be either public or onlyFriends',
  })
  privacy?: PublicationPrivacy;
}
