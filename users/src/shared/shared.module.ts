import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentType } from './entities/document-type.entity';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, DocumentType])],
  exports: [TypeOrmModule.forFeature([User, Role, DocumentType])],
})
export class SharedModule {}
