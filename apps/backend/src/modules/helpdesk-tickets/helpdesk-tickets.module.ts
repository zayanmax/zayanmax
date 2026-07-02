import { Module } from '@nestjs/common';
import { HelpdeskTicketsController } from './helpdesk-tickets.controller';
import { HelpdeskTicketsService } from './helpdesk-tickets.service';

@Module({
  controllers: [HelpdeskTicketsController],
  providers: [HelpdeskTicketsService],
})
export class HelpdeskTicketsModule {}
