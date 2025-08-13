import { Module } from '@nestjs/common';
import { FileHandlerService } from './services/file-handler.service';
import { FileValidationService } from './services/file-validation.service';

@Module({
  providers: [FileValidationService, FileHandlerService],
  exports: [FileValidationService, FileHandlerService],
})
export class CommonModule {}
