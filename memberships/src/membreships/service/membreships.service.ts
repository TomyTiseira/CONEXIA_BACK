import { Injectable } from '@nestjs/common';
import { CreateMembreshipDto } from '../dto/create-membreship.dto';
import { UpdateMembreshipDto } from '../dto/update-membreship.dto';
import { MembreshipRepository } from '../repository/membreship.repository';
import { PingUseCase } from './use-cases/ping.use-case';

@Injectable()
export class MembreshipsService {
  constructor(
    private readonly membreshipRepository: MembreshipRepository,
    private readonly pingUseCase: PingUseCase,
  ) {}

  create(createMembreshipDto: CreateMembreshipDto) {
    return 'This action adds a new membreship';
  }

  findAll() {
    return `This action returns all membreships`;
  }

  findOne(id: number) {
    return `This action returns a #${id} membreship`;
  }

  update(id: number, updateMembreshipDto: UpdateMembreshipDto) {
    return `This action updates a #${id} membreship`;
  }

  remove(id: number) {
    return `This action removes a #${id} membreship`;
  }

  ping() {
    return this.pingUseCase.execute();
  }
}

