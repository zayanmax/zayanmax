import { Module } from '@nestjs/common';
import { SalesLeadsQuotationsController } from './sales-leads-quotations.controller';
import { SalesLeadsQuotationsService } from './sales-leads-quotations.service';

@Module({
  controllers: [SalesLeadsQuotationsController],
  providers: [SalesLeadsQuotationsService],
})
export class SalesLeadsQuotationsModule {}
