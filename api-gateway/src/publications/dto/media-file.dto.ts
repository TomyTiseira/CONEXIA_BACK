import { IsIn, IsNumber, IsString } from 'class-validator';

export class MediaFileDto {
  @IsString({ message: 'filename must be a string' })
  filename: string;

  @IsString({ message: 'fileUrl must be a string' })
  fileUrl: string;

  @IsIn(['image/jpeg', 'image/png', 'image/gif', 'video/mp4'], {
    message: 'fileType must be image/jpeg, image/png, image/gif or video/mp4',
  })
  fileType: string;

  @IsNumber({}, { message: 'fileSize must be a number' })
  fileSize: number;

  @IsNumber({}, { message: 'displayOrder must be a number' })
  displayOrder: number;
}
