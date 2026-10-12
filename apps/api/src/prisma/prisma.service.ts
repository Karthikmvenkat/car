import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isDatabaseAvailable = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isDatabaseAvailable = true;
      this.logger.log('Database connection established');
    } catch (error) {
      this.isDatabaseAvailable = false;
      this.logger.warn(
        'Database unavailable — running in demo mode with in-memory auth. ' +
        'Set up PostgreSQL to persist data.'
      );
    }
  }

  async onModuleDestroy() {
    if (this.isDatabaseAvailable) {
      await this.$disconnect();
    }
  }
}
