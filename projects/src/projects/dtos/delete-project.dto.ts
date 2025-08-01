import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DeleteProjectDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'projectId must be a number' },
  )
  @IsNotEmpty()
  projectId: number;

  @IsString({ message: 'reason must be a string' })
  @IsNotEmpty()
  reason: string;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'userId must be a number' },
  )
  @IsNotEmpty()
  userId: number;
}
