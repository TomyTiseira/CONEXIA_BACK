import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { DocumentTypesService } from '../service/document-types.service';

@Controller()
export class DocumentTypesController {
  constructor(private readonly documentTypesService: DocumentTypesService) {}

  @MessagePattern('findAllDocumentTypes')
  findAll() {
    return this.documentTypesService.findAll();
  }
}
