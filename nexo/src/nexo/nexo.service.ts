import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateNexoDto } from './dto/create-nexo.dto';
import { UpdateNexoDto } from './dto/update-nexo.dto';
import { Nexo } from './entities/nexo.entity';

@Injectable()
export class NexoService {
  constructor(
    @InjectRepository(Nexo)
    private readonly nexoRepository: Repository<Nexo>,
  ) {}

  async create(createNexoDto: CreateNexoDto): Promise<Nexo> {
    const nexo = this.nexoRepository.create({
      ...createNexoDto,
      createdAt: new Date(),
    });
    return await this.nexoRepository.save(nexo);
  }

  async findAll(): Promise<Nexo[]> {
    return await this.nexoRepository.find();
  }

  async findOne(id: string): Promise<Nexo> {
    const nexo = await this.nexoRepository.findOne({ where: { id } });
    if (!nexo) {
      throw new NotFoundException(`Nexo with ID ${id} not found`);
    }
    return nexo;
  }

  async update(id: string, updateNexoDto: UpdateNexoDto): Promise<Nexo> {
    const nexo = await this.findOne(id);
    Object.assign(nexo, updateNexoDto, { updatedAt: new Date() });
    return await this.nexoRepository.save(nexo);
  }

  async remove(id: string): Promise<void> {
    const nexo = await this.findOne(id);
    await this.nexoRepository.remove(nexo);
  }

  async search(query: string): Promise<Nexo[]> {
    return await this.nexoRepository
      .createQueryBuilder('nexo')
      .where('nexo.question ILIKE :query', { query: `%${query}%` })
      .orWhere('nexo.answer ILIKE :query', { query: `%${query}%` })
      .getMany();
  }
}
