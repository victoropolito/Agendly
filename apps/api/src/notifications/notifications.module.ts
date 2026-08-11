import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { NOTIFICATIONS_QUEUE } from './notification.types';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsQueueService } from './notifications-queue.service';
import { DevelopmentWhatsAppProvider } from './whatsapp/development-whatsapp.provider';
import { MetaCloudApiProvider } from './whatsapp/meta-cloud-api.provider';
import { WhatsAppDispatcherService } from './whatsapp/whatsapp-dispatcher.service';

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  providers: [
    NotificationsQueueService,
    NotificationsProcessor,
    WhatsAppDispatcherService,
    DevelopmentWhatsAppProvider,
    MetaCloudApiProvider,
  ],
  exports: [NotificationsQueueService],
})
export class NotificationsModule {}
