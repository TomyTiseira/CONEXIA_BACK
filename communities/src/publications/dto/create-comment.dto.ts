import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'content is required' })
  @IsString({ message: 'content must be a string' })
  content: string;

  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber({}, { message: 'userId must be a number' })
  userId: number;

  @IsNotEmpty({ message: 'publicationId is required' })
  @IsNumber({}, { message: 'publicationId must be a number' })
  publicationId: number;
}
