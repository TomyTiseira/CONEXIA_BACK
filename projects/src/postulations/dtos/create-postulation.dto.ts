import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePostulationDto {
  @IsNotEmpty({ message: 'projectId is required' })
  @IsNumber()
  projectId: number;

  @IsNotEmpty({ message: 'cvUrl is required' })
  @IsString()
  cvUrl: string;

  @IsNotEmpty({ message: 'cvFilename is required' })
  @IsString()
  cvFilename: string;

  @IsNotEmpty({ message: 'cvSize is required' })
  @IsNumber()
  cvSize: number;
}
