import type { NotificationType } from '@prisma/client';

export interface AppointmentEventJob {
  tenantId: string;
  appointmentId: string;
  type: NotificationType;
}

export const NOTIFICATIONS_QUEUE = 'notifications';
export const APPOINTMENT_EVENT_JOB = 'appointment-event';
