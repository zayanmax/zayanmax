import { Module } from '@nestjs/common';
import { CalendarSchedulingController } from './calendar-scheduling.controller';
import { CalendarSchedulingService } from './calendar-scheduling.service';

@Module({
  controllers: [CalendarSchedulingController],
  providers: [CalendarSchedulingService],
})
export class CalendarSchedulingModule {}
