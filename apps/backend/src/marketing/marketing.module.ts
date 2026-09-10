import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller';
import { PollinationsApiService } from './pollinations-api.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [MarketingController],
  providers: [PollinationsApiService],
  exports: [PollinationsApiService],
})
export class MarketingModule {}
