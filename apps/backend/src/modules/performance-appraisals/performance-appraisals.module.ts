import { Module } from '@nestjs/common';
import { PerformanceAppraisalsController } from './performance-appraisals.controller';
import { PerformanceAppraisalsService } from './performance-appraisals.service';

@Module({
  controllers: [PerformanceAppraisalsController],
  providers: [PerformanceAppraisalsService],
})
export class PerformanceAppraisalsModule {}
