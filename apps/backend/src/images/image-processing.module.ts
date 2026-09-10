import { Module } from '@nestjs/common';
import { ImageProcessingController } from './image-processing.controller';
import { BackgroundRemovalService } from './background-removal.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ImageProcessingController],
  providers: [BackgroundRemovalService],
  exports: [BackgroundRemovalService],
})
export class ImageProcessingModule {}
