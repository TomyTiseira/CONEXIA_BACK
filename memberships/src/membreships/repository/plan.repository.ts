import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Benefit } from '../entities/benefit.entity';
import { Plan } from '../entities/plan.entity';

@Injectable()
export class PlanRepository {
  constructor(
    @InjectRepository(Plan)
    private readonly repo: Repository<Plan>,
    @InjectRepository(Benefit)
    private readonly benefitRepo: Repository<Benefit>,
  ) {}

  create(data: Partial<Plan>) {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: number, data: Partial<Plan>) {
    const plan = await this.repo.findOne({ where: { id } });
    if (!plan) return null;
    const merged = this.repo.merge(plan, data);
    return this.repo.save(merged);
  }

  async findAll(includeInactive = false) {
    const where: { deletedAt: any; active?: boolean } = {
      deletedAt: IsNull(),
    };
    if (!includeInactive) {
      where.active = true;
    }

    // Obtener los planes ordenados por precio (de menor a mayor)
    const plans = await this.repo.find({
      where,
      order: {
        monthlyPrice: 'ASC',
      },
    });

    // Obtener todos los benefits para hacer el mapeo
    const allBenefits = await this.benefitRepo.find();
    const benefitsMap = new Map<string, Benefit>(
      allBenefits.map((b) => [b.key, b]),
    );

    // Enriquecer cada plan con el name de los benefits
    return plans.map((plan) => ({
      ...plan,
      benefits:
        (plan.benefits as Array<{ key: string; value: unknown }>)?.map(
          (benefit) => {
            const benefitEntity = benefitsMap.get(benefit.key);
            return {
              key: benefit.key,
              value: benefit.value,
              name: benefitEntity?.name || benefit.key,
            };
          },
        ) || [],
    }));
  }

  async findById(id: number, includeInactive = false) {
    const where: { id: number; active?: boolean } = { id };
    if (!includeInactive) {
      where.active = true;
    }

    const plan = await this.repo.findOne({ where });
    if (!plan) return null;

    // Obtener todos los benefits para hacer el mapeo
    const allBenefits = await this.benefitRepo.find();
    const benefitsMap = new Map<string, Benefit>(
      allBenefits.map((b) => [b.key, b]),
    );

    // Enriquecer el plan con el name de los benefits
    return {
      ...plan,
      benefits:
        (plan.benefits as Array<{ key: string; value: unknown }>)?.map(
          (benefit) => {
            const benefitEntity = benefitsMap.get(benefit.key);
            return {
              key: benefit.key,
              value: benefit.value,
              name: benefitEntity?.name || benefit.key,
            };
          },
        ) || [],
    };
  }

  async softDelete(id: number) {
    await this.repo.softDelete(id);
  }

  async hardDelete(id: number) {
    await this.repo.delete(id);
  }

  async findFreePlan(): Promise<Plan | null> {
    const plan = await this.repo.findOne({
      where: {
        monthlyPrice: 0,
        deletedAt: IsNull(),
      },
    });

    if (!plan) return null;

    // Obtener todos los benefits para hacer el mapeo
    const allBenefits = await this.benefitRepo.find();
    const benefitsMap = new Map<string, Benefit>(
      allBenefits.map((b) => [b.key, b]),
    );

    // Enriquecer el plan con el name de los benefits
    return {
      ...plan,
      benefits:
        (plan.benefits as Array<{ key: string; value: unknown }>)?.map(
          (benefit) => {
            const benefitEntity = benefitsMap.get(benefit.key);
            return {
              key: benefit.key,
              value: benefit.value,
              name: benefitEntity?.name || benefit.key,
            };
          },
        ) || [],
    } as Plan;
  }
}
