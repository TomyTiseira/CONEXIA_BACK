import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PublicationPrivacy } from '../enums/privacy.enum';

export class EditPublicationRequestDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'id must be a number' })
  @IsPositive({ message: 'id must be a positive number' })
  id: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'userId must be a number' })
  @IsPositive({ message: 'userId must be a positive number' })
  userId: number;

  @ValidateNested()
  @Type(() => UpdatePublicationDataDto)
  updateData: UpdatePublicationDataDto;
}

export class UpdatePublicationDataDto {
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
