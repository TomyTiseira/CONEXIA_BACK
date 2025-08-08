import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Locality } from '../entities/locality.entity';

@Injectable()
export class LocalityRepository {
  constructor(
    @InjectRepository(Locality)
    private readonly localityRepository: Repository<Locality>,
  ) {}

  async findAll(): Promise<Locality[]> {
    return this.localityRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findById(id: number): Promise<Locality | null> {
    return this.localityRepository.findOne({ where: { id } });
  }

  async findByIds(ids: number[]): Promise<Locality[]> {
    return this.localityRepository.findByIds(ids);
  }

  async create(locality: Partial<Locality>): Promise<Locality> {
    const newLocality = this.localityRepository.create(locality);
    return this.localityRepository.save(newLocality);
  }

  async createMany(localities: Partial<Locality>[]): Promise<Locality[]> {
    const newLocalities = this.localityRepository.create(localities);
    return this.localityRepository.save(newLocalities);
  }
}
