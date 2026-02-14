import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class MediaFileDto {
  // Fields for base64 data from API Gateway
  @IsOptional()
  @IsString({ message: 'fileData must be a string' })
  fileData?: string; // base64 encoded file

  @IsOptional()
  @IsString({ message: 'originalName must be a string' })
  originalName?: string;

  @IsOptional()
  @IsIn(['image/jpeg', 'image/png', 'image/gif', 'video/mp4'], {
    message: 'mimeType must be image/jpeg, image/png, image/gif or video/mp4',
  })
  mimeType?: string;

  @IsOptional()
  @IsNumber({}, { message: 'size must be a number' })
  size?: number;

  // Legacy fields (for backwards compatibility)
  @IsOptional()
  @IsString({ message: 'filename must be a string' })
  filename?: string;

  @IsOptional()
  @IsString({ message: 'fileUrl must be a string' })
  fileUrl?: string;

  @IsOptional()
  @IsIn(['image/jpeg', 'image/png', 'image/gif', 'video/mp4'], {
    message: 'fileType must be image/jpeg, image/png, image/gif or video/mp4',
  })
  fileType?: string;

  @IsOptional()
  @IsNumber({}, { message: 'fileSize must be a number' })
  fileSize?: number;

  @IsNumber({}, { message: 'displayOrder must be a number' })
  displayOrder: number;
}
