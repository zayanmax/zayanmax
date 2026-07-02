import { Module } from '@nestjs/common';
import { CommunicationNotificationsController } from './communication-notifications.controller';
import { CommunicationNotificationsService } from './communication-notifications.service';

@Module({
  controllers: [CommunicationNotificationsController],
  providers: [CommunicationNotificationsService],
})
export class CommunicationNotificationsModule {}
