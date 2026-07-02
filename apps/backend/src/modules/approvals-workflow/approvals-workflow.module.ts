import { Module } from '@nestjs/common';
import { ApprovalsWorkflowController } from './approvals-workflow.controller';
import { ApprovalsWorkflowService } from './approvals-workflow.service';

@Module({
  controllers: [ApprovalsWorkflowController],
  providers: [ApprovalsWorkflowService],
})
export class ApprovalsWorkflowModule {}
