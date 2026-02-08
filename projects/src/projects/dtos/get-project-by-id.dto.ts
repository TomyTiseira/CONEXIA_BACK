import { IsNumber } from 'class-validator';

export class GetProjectByIdDto {
  @IsNumber()
  id: number;

  @IsNumber()
  currentUserId: number;
}
