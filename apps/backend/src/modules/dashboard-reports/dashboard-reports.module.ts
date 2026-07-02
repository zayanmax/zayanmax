import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { DashboardReportsController } from './dashboard-reports.controller';
import { DashboardReportsService } from './dashboard-reports.service';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardReportsController],
  providers: [DashboardReportsService],
})
export class DashboardReportsModule {}
