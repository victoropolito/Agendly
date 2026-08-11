import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { Queue } from 'bullmq';

import { APPOINTMENT_EVENT_JOB, NOTIFICATIONS_QUEUE, type AppointmentEventJob } from './notification.types';

@Injectable()
export class NotificationsQueueService {
  private readonly logger = new Logger(NotificationsQueueService.name);

  constructor(@InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue<AppointmentEventJob>) {}

  async enqueueAppointmentEvent(tenantId: string, appointmentId: string, type: NotificationType): Promise<void> {
    try {
      await this.queue.add(
        APPOINTMENT_EVENT_JOB,
        { tenantId, appointmentId, type },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: true, removeOnFail: 100 },
      );
    } catch (error) {
      // Notifications are best-effort: a queue/Redis outage must never fail the booking itself.
      this.logger.error(`Failed to enqueue notification for appointment ${appointmentId}`, error as Error);
    }
  }
}
