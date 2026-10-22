import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  PublicQuotationsController,
  QuotationsController,
} from './quotations.controller';
import { QuotationsService } from './quotations.service';
@Module({
  imports: [AuthModule],
  controllers: [PublicQuotationsController, QuotationsController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
