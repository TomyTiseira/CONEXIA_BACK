import { PartialType } from '@nestjs/mapped-types';
import { CreateNexoDto } from './create-nexo.dto';

export class UpdateNexoDto extends PartialType(CreateNexoDto) {}
