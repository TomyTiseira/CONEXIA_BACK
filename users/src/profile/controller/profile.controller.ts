import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { GetProfileDto } from '../dto/get-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileService } from '../service/profile.service';

@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @MessagePattern('getProfile')
  getProfile(@Payload() getProfileDto: GetProfileDto) {
    return this.profileService.getProfile(getProfileDto);
  }

  @MessagePattern('createProfile')
  create(@Payload() dto: CreateProfileDto) {
    return this.profileService.createProfile(dto);
  }

  @MessagePattern('updateProfile')
  update(@Payload() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(dto);
  }
}
