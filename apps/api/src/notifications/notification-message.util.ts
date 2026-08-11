import { NotificationType } from '@prisma/client';

import { utcToLocalTime } from '../common/tenant-time.util';

interface AppointmentForMessage {
  startsAt: Date;
  customer: { name: string };
  professional: { name: string };
  service: { name: string };
  tenant: { name: string; timezone: string };
}

export function buildAppointmentMessage(type: NotificationType, appointment: AppointmentForMessage): string {
  const date = appointment.startsAt.toLocaleDateString('pt-BR', { timeZone: appointment.tenant.timezone });
  const time = utcToLocalTime(appointment.startsAt, appointment.tenant.timezone);
  const details = `Barbearia: ${appointment.tenant.name}\nServiço: ${appointment.service.name}\nProfissional: ${appointment.professional.name}\nData: ${date}\nHorário: ${time}`;

  switch (type) {
    case NotificationType.APPOINTMENT_CONFIRMED:
      return `Olá, ${appointment.customer.name}! Seu agendamento foi confirmado.\n${details}`;
    case NotificationType.APPOINTMENT_CANCELLED:
      return `Olá, ${appointment.customer.name}. Seu agendamento foi cancelado.\n${details}`;
    case NotificationType.APPOINTMENT_RESCHEDULED:
      return `Olá, ${appointment.customer.name}! Seu agendamento foi reagendado.\n${details}`;
    case NotificationType.APPOINTMENT_REMINDER:
      return `Olá, ${appointment.customer.name}! Lembrete do seu agendamento.\n${details}`;
    default:
      return details;
  }
}
