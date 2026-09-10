import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@artisan/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('[YOUR-PASSWORD]')) {
      this.logger.warn(
        'DATABASE_URL contains placeholder "[YOUR-PASSWORD]". Skipping eager DB connection on boot.',
      );
      this.logger.warn(
        'Update apps/backend/.env with your real Supabase PostgreSQL password to enable live database queries.',
      );
      return;
    }

    try {
      await this.$connect();
      this.logger.log('Prisma connected to PostgreSQL / Supabase successfully.');
    } catch (error) {
      this.logger.error('Failed to connect to PostgreSQL / Supabase via Prisma:', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from PostgreSQL / Supabase.');
  }
}
