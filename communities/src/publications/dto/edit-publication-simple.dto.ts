import { Type } from 'class-transformer';
import { IsNumber, IsPositive, ValidateNested } from 'class-validator';
import { UpdatePublicationDto } from './update-publication.dto';

export class EditPublicationSimpleDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'id must be a number' })
  @IsPositive({ message: 'id must be a positive number' })
  id: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'userId must be a number' })
  @IsPositive({ message: 'userId must be a positive number' })
  userId: number;

  @ValidateNested()
  @Type(() => UpdatePublicationDto)
  updatePublicationDto: UpdatePublicationDto;
}
