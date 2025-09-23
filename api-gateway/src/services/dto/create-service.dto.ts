import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, { message: 'title must be less than 50 characters' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500, {
    message: 'description must be less than 500 characters',
  })
  description: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  @Min(1, { message: 'price must be greater than 1' })
  price: number;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  categoryId: number;

  @Transform(({ value }) => Number(value))
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'estimatedHours must be greater than or equal to 1 hour' })
  estimatedHours?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Maximum 5 images allowed' })
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsString()
  status?: string;
}
