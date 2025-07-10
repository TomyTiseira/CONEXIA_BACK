import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { ProfileService } from '../service/profile.service';

@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @MessagePattern('createProfile')
  async create(@Payload() dto: CreateProfileDto) {
    return this.profileService.createProfile(dto);
  }
}
