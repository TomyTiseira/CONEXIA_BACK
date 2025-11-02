import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membreship } from '../entities/membreship.entity';

@Injectable()
export class MembreshipRepository {
  constructor(
    @InjectRepository(Membreship)
    private readonly ormRepository: Repository<Membreship>,
  ) {}

  async create(membreship: Partial<Membreship>): Promise<Membreship> {
    const entity = this.ormRepository.create(membreship);
    return this.ormRepository.save(entity);
  }

  async update(
    id: number,
    membreship: Partial<Membreship>,
  ): Promise<Membreship | null> {
    await this.ormRepository.update(id, membreship);
    return this.ormRepository.findOne({ where: { id } });
  }

  async findById(id: number): Promise<Membreship | null> {
    return this.ormRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Membreship[]> {
    return this.ormRepository.find();
  }

  async remove(id: number): Promise<void> {
    await this.ormRepository.delete(id);
  }
}

