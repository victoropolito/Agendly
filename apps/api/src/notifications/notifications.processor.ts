import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import type { Job } from 'bullmq';

import { PrismaService } from '../prisma/prisma.service';
import { buildAppointmentMessage } from './notification-message.util';
import { NOTIFICATIONS_QUEUE, type AppointmentEventJob } from './notification.types';
import { WhatsAppDispatcherService } from './whatsapp/whatsapp-dispatcher.service';

@Processor(NOTIFICATIONS_QUEUE)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsAppDispatcher: WhatsAppDispatcherService,
  ) {
    super();
  }

  async process(job: Job<AppointmentEventJob>): Promise<void> {
    const { tenantId, appointmentId, type } = job.data;

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: { customer: true, professional: true, service: true, tenant: true },
    });
    if (!appointment) {
      this.logger.warn(`Appointment ${appointmentId} not found for tenant ${tenantId}; skipping notification.`);
      return;
    }

    if (!appointment.customer.phoneNormalized) {
      this.logger.log(
        `Customer ${appointment.customer.id} has no WhatsApp number on file; skipping ${type} notification.`,
      );
      return;
    }

    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        appointmentId,
        channel: NotificationChannel.WHATSAPP,
        type,
        recipient: appointment.customer.phoneNormalized,
        payload: {
          serviceName: appointment.service.name,
          professionalName: appointment.professional.name,
          startsAt: appointment.startsAt.toISOString(),
        },
        status: NotificationStatus.PROCESSING,
        attempts: job.attemptsMade + 1,
      },
    });

    const body = buildAppointmentMessage(type, appointment);
    const result = await this.whatsAppDispatcher.send(tenantId, { to: appointment.customer.phoneNormalized, body });

    await this.prisma.notification.update({
      where: { id: notification.id },
      data: result.success
        ? { status: NotificationStatus.SENT, sentAt: new Date() }
        : { status: NotificationStatus.FAILED, lastError: result.error },
    });
  }
}
