import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AppointmentReminderScheduler } from './appointment-reminder.scheduler';
import { NOTIFICATIONS_QUEUE } from './notification.types';
import { NotificationsProcessor } from './notifications.processor';
import { NotificationsQueueService } from './notifications-queue.service';
import { DevelopmentWhatsAppProvider } from './whatsapp/development-whatsapp.provider';
import { EvolutionApiProvider } from './whatsapp/evolution-api.provider';
import { MetaCloudApiProvider } from './whatsapp/meta-cloud-api.provider';
import { TwilioWhatsAppProvider } from './whatsapp/twilio-whatsapp.provider';
import { WhatsAppConnectionService } from './whatsapp/whatsapp-connection.service';
import { WhatsAppDispatcherService } from './whatsapp/whatsapp-dispatcher.service';

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATIONS_QUEUE })],
  providers: [
    NotificationsQueueService,
    NotificationsProcessor,
    AppointmentReminderScheduler,
    WhatsAppDispatcherService,
    WhatsAppConnectionService,
    DevelopmentWhatsAppProvider,
    MetaCloudApiProvider,
    TwilioWhatsAppProvider,
    EvolutionApiProvider,
  ],
  exports: [NotificationsQueueService, WhatsAppConnectionService, AppointmentReminderScheduler],
})
export class NotificationsModule {}
