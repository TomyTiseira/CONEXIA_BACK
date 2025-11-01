import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateMembreshipDto } from './dto/create-membreship.dto';
import { UpdateMembreshipDto } from './dto/update-membreship.dto';
import { MembreshipsService } from './membreships.service';

@Controller()
export class MembreshipsController {
  constructor(private readonly membreshipsService: MembreshipsService) {}

  @MessagePattern('createMembreship')
  create(@Payload() createMembreshipDto: CreateMembreshipDto) {
    return this.membreshipsService.create(createMembreshipDto);
  }

  @MessagePattern('findAllMembreships')
  findAll() {
    return this.membreshipsService.findAll();
  }

  @MessagePattern('findOneMembreship')
  findOne(@Payload() id: number) {
    return this.membreshipsService.findOne(id);
  }

  @MessagePattern('updateMembreship')
  update(@Payload() updateMembreshipDto: UpdateMembreshipDto) {
    return this.membreshipsService.update(
      updateMembreshipDto.id,
      updateMembreshipDto,
    );
  }

  @MessagePattern('removeMembreship')
  remove(@Payload() id: number) {
    return this.membreshipsService.remove(id);
  }

  @MessagePattern('memberships_ping')
  ping() {
    return this.membreshipsService.ping();
  }
}
