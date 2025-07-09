import { Injectable } from '@nestjs/common';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { CreateProfileUseCase } from './use-cases/create-profile.use-case';

@Injectable()
export class ProfileService {
  constructor(private readonly createUseCase: CreateProfileUseCase) {}

  createProfile(dto: CreateProfileDto) {
    return this.createUseCase.execute(dto);
  }
}