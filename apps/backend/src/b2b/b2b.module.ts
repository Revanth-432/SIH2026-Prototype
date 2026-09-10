import { Module } from '@nestjs/common';
import { B2BController } from './b2b.controller';
import { B2BService } from './b2b.service';

@Module({
  controllers: [B2BController],
  providers: [B2BService],
  exports: [B2BService],
})
export class B2BModule {}
