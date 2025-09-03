import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteCommentDto {
  @IsNotEmpty({ message: 'id is required' })
  @IsNumber({}, { message: 'id must be a number' })
  id: number;

  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber({}, { message: 'userId must be a number' })
  userId: number;
}
