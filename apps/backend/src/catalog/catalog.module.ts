import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CatalogRepository } from './catalog.repository';
import { StorageModule } from '../storage/storage.module';
import { PricingModule } from '../pricing/pricing.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [StorageModule, PricingModule, UsersModule],
  controllers: [CatalogController],
  providers: [CatalogService, CatalogRepository],
  exports: [CatalogService, CatalogRepository],
})
export class CatalogModule {}
