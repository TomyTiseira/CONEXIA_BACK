import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bank } from '../../../shared/entities/bank.entity';
import { BankResponseDto } from '../../dto/bank-response.dto';

@Injectable()
export class GetBanksUseCase {
  constructor(
    @InjectRepository(Bank)
    private readonly bankRepository: Repository<Bank>,
  ) {}

  async execute(): Promise<BankResponseDto[]> {
    const banks = await this.bankRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    return banks.map((bank) => ({
      id: bank.id,
      name: bank.name,
      code: bank.code,
      isActive: bank.isActive,
    }));
  }
}
