import { Injectable } from '@nestjs/common';
import { BenefitRepository } from '../../repository/benefit.repository';

@Injectable()
export class GetBenefitsUseCase {
  constructor(private readonly benefits: BenefitRepository) {}

  async execute() {
    return this.benefits.findAllActive();
  }
}
