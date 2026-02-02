import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNexoDto } from './dto/create-nexo.dto';
import { UpdateNexoDto } from './dto/update-nexo.dto';
import { FaqEmbedding } from './entities/faq-embedding.entity';

@Injectable()
export class NexoService {
  constructor(
    @InjectRepository(FaqEmbedding)
    private readonly faqRepository: Repository<FaqEmbedding>,
  ) {}

  async create(createNexoDto: CreateNexoDto): Promise<FaqEmbedding> {
    const faq = this.faqRepository.create({
      ...createNexoDto,
      createdAt: new Date(),
    });
    return await this.faqRepository.save(faq);
  }

  async findAll(): Promise<FaqEmbedding[]> {
    return await this.faqRepository.find();
  }

  async findOne(id: string): Promise<FaqEmbedding> {
    const faq = await this.faqRepository.findOne({ where: { id } });
    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }
    return faq;
  }

  async update(
    id: string,
    updateNexoDto: UpdateNexoDto,
  ): Promise<FaqEmbedding> {
    const faq = await this.findOne(id);
    Object.assign(faq, updateNexoDto, { updatedAt: new Date() });
    return await this.faqRepository.save(faq);
  }

  async remove(id: string): Promise<void> {
    const faq = await this.findOne(id);
    await this.faqRepository.remove(faq);
  }

  async search(query: string): Promise<FaqEmbedding[]> {
    return await this.faqRepository
      .createQueryBuilder('faq')
      .where('faq.question ILIKE :query', { query: `%${query}%` })
      .orWhere('faq.answer ILIKE :query', { query: `%${query}%` })
      .getMany();
  }
}
