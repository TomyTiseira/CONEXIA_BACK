import { PartialType } from '@nestjs/mapped-types';
import { CreateMembreshipDto } from './create-membreship.dto';

export class UpdateMembreshipDto extends PartialType(CreateMembreshipDto) {
  id: number;
}
