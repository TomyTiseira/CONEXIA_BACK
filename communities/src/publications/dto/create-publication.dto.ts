import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePublicationDto {
  @IsNotEmpty({ message: 'description is required' })
  @IsString({ message: 'description must be a string' })
  description: string;

  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber({}, { message: 'userId must be a number' })
  userId: number;

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
}
