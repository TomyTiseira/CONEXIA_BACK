import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'content is required' })
  @IsString({ message: 'content must be a string' })
  content: string;
}
