import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from '../../shared/entities/document-type.entity';

@Injectable()
export class DocumentTypesService {
  constructor(
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
  ) {}

  async findAll(): Promise<DocumentType[]> {
    return this.documentTypeRepository.find({
      select: ['id', 'name', 'description'],
      where: { isActive: true },
    });
  }
}
