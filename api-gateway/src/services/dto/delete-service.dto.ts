import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteServiceDto {
  @IsString({ message: 'reason must be a string' })
  @IsNotEmpty({ message: 'reason is required' })
  reason: string;
}
