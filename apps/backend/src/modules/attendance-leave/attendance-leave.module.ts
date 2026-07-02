import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceLeaveService } from './attendance-leave.service';
import { HolidaysController } from './holidays.controller';
import { LeavesController } from './leaves.controller';
import { ShiftsController } from './shifts.controller';

@Module({
  controllers: [
    AttendanceController,
    ShiftsController,
    LeavesController,
    HolidaysController,
  ],
  providers: [AttendanceLeaveService],
})
export class AttendanceLeaveModule {}
