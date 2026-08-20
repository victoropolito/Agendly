import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentStatus, NotificationType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsQueueService } from './notifications-queue.service';

const REMINDER_LEAD_TIME_MS = 2 * 60 * 60 * 1000;

/**
 * Every few minutes, finds confirmed appointments starting within the reminder lead time that
 * haven't been reminded yet, and enqueues an APPOINTMENT_REMINDER notification for each.
 * `reminderSentAt` is claimed up front so a slow tick never re-enqueues the same appointment.
 */
@Injectable()
export class AppointmentReminderScheduler {
  private readonly logger = new Logger(AppointmentReminderScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsQueue: NotificationsQueueService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron(): Promise<void> {
    await this.scanAndEnqueueReminders();
  }

  async scanAndEnqueueReminders(): Promise<number> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_LEAD_TIME_MS);

    const candidates = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        reminderSentAt: null,
        startsAt: { lte: windowEnd, gt: now },
      },
      select: { id: true, tenantId: true },
    });

    if (candidates.length === 0) {
      return 0;
    }

    await this.prisma.appointment.updateMany({
      where: { id: { in: candidates.map((candidate) => candidate.id) } },
      data: { reminderSentAt: now },
    });

    for (const candidate of candidates) {
      void this.notificationsQueue.enqueueAppointmentEvent(candidate.tenantId, candidate.id, NotificationType.APPOINTMENT_REMINDER);
    }

    this.logger.log(`Enfileirados ${candidates.length} lembrete(s) de agendamento.`);
    return candidates.length;
  }
}
