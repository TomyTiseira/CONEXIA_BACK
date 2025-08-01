import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteProjectDto {
  @IsString({ message: 'reason must be a string' })
  @IsNotEmpty()
  reason: string;
}
