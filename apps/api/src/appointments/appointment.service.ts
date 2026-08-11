import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentSource, AppointmentStatus, NotificationType, ScheduleEntryKind } from '@prisma/client';
import { DateTime } from 'luxon';

import { isScheduleConflictError } from '../common/schedule-conflict.util';
import { fromTimeDate } from '../common/time.util';
import { earlierOf, isValidDateString, jsWeekdayOf, laterOf, localDateTimeToUtc } from '../common/tenant-time.util';
import { NotificationsQueueService } from '../notifications/notifications-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from '../tenants/tenant-context';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

const CONFLICT_MESSAGE = 'Este horário acabou de ser reservado. Escolha outro horário disponível.';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsQueue: NotificationsQueueService,
  ) {}

  async findAll(context: TenantContext, filters: ListAppointmentsDto & { customerId?: string }) {
    const where: Record<string, unknown> = { tenantId: context.tenantId };
    if (filters.professionalId) {
      where.professionalId = filters.professionalId;
    }
    if (filters.customerId) {
      where.customerId = filters.customerId;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.date) {
      if (!isValidDateString(filters.date)) {
        throw new BadRequestException('Data inválida.');
      }
      const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } });
      where.startsAt = {
        gte: DateTime.fromISO(filters.date, { zone: tenant.timezone }).startOf('day').toUTC().toJSDate(),
        lt: DateTime.fromISO(filters.date, { zone: tenant.timezone }).endOf('day').toUTC().toJSDate(),
      };
    }

    return this.prisma.appointment.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: {
        customer: { select: { id: true, name: true, phoneNormalized: true } },
        professional: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });
  }

  async findOne(context: TenantContext, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId: context.tenantId },
      include: {
        customer: { select: { id: true, name: true, phoneNormalized: true } },
        professional: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
      },
    });
    if (!appointment) {
      throw new NotFoundException();
    }
    return appointment;
  }

  async create(context: TenantContext, dto: CreateAppointmentDto, source: AppointmentSource) {
    if (!isValidDateString(dto.date)) {
      throw new BadRequestException('Data inválida.');
    }

    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } });
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, tenantId: context.tenantId } });
    if (!customer) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, tenantId: context.tenantId, isActive: true, deletedAt: null },
    });
    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }
    const professional = await this.prisma.professional.findFirst({
      where: { id: dto.professionalId, tenantId: context.tenantId, isActive: true },
      include: { services: { select: { serviceId: true } } },
    });
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }
    if (!professional.services.some((link) => link.serviceId === dto.serviceId)) {
      throw new BadRequestException('Este profissional não realiza o serviço selecionado.');
    }

    const startsAt = localDateTimeToUtc(dto.date, dto.startTime, tenant.timezone);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

    await this.assertBookable(context.tenantId, tenant.timezone, professional.id, dto.date, startsAt, endsAt);

    let appointment;
    try {
      appointment = await this.prisma.$transaction(async (tx) => {
        const created = await tx.appointment.create({
          data: {
            tenantId: context.tenantId,
            customerId: customer.id,
            professionalId: professional.id,
            serviceId: service.id,
            startsAt,
            endsAt,
            priceCentsSnapshot: service.priceCents,
            durationMinutesSnapshot: service.durationMinutes,
            source,
            notes: dto.notes,
          },
        });
        await tx.scheduleEntry.create({
          data: {
            tenantId: context.tenantId,
            professionalId: professional.id,
            appointmentId: created.id,
            kind: ScheduleEntryKind.APPOINTMENT,
            startsAt,
            endsAt,
          },
        });
        return created;
      });
    } catch (error) {
      if (isScheduleConflictError(error)) {
        throw new ConflictException({ statusCode: 409, code: 'APPOINTMENT_SLOT_UNAVAILABLE', message: CONFLICT_MESSAGE });
      }
      throw error;
    }

    void this.notificationsQueue.enqueueAppointmentEvent(context.tenantId, appointment.id, NotificationType.APPOINTMENT_CONFIRMED);
    return appointment;
  }

  async cancel(context: TenantContext, id: string) {
    const appointment = await this.findOne(context, id);
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Apenas agendamentos confirmados podem ser cancelados.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED, cancelledAt: new Date() },
      });
      await tx.scheduleEntry.deleteMany({ where: { appointmentId: id } });
      return result;
    });

    void this.notificationsQueue.enqueueAppointmentEvent(context.tenantId, id, NotificationType.APPOINTMENT_CANCELLED);
    return updated;
  }

  async reschedule(context: TenantContext, id: string, dto: RescheduleAppointmentDto) {
    if (!isValidDateString(dto.date)) {
      throw new BadRequestException('Data inválida.');
    }

    const appointment = await this.findOne(context, id);
    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Apenas agendamentos confirmados podem ser reagendados.');
    }

    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } });
    const professionalId = dto.professionalId ?? appointment.professionalId;

    if (dto.professionalId && dto.professionalId !== appointment.professionalId) {
      const professional = await this.prisma.professional.findFirst({
        where: { id: dto.professionalId, tenantId: context.tenantId, isActive: true },
        include: { services: { select: { serviceId: true } } },
      });
      if (!professional) {
        throw new NotFoundException('Profissional não encontrado.');
      }
      if (!professional.services.some((link) => link.serviceId === appointment.serviceId)) {
        throw new BadRequestException('Este profissional não realiza o serviço deste agendamento.');
      }
    }

    const startsAt = localDateTimeToUtc(dto.date, dto.startTime, tenant.timezone);
    const endsAt = new Date(startsAt.getTime() + appointment.durationMinutesSnapshot * 60_000);

    await this.assertBookable(context.tenantId, tenant.timezone, professionalId, dto.date, startsAt, endsAt);

    let updated;
    try {
      updated = await this.prisma.$transaction(async (tx) => {
        const result = await tx.appointment.update({
          where: { id },
          data: { professionalId, startsAt, endsAt },
        });
        await tx.scheduleEntry.update({
          where: { appointmentId: id },
          data: { professionalId, startsAt, endsAt },
        });
        return result;
      });
    } catch (error) {
      if (isScheduleConflictError(error)) {
        throw new ConflictException({ statusCode: 409, code: 'APPOINTMENT_SLOT_UNAVAILABLE', message: CONFLICT_MESSAGE });
      }
      throw error;
    }

    void this.notificationsQueue.enqueueAppointmentEvent(context.tenantId, id, NotificationType.APPOINTMENT_RESCHEDULED);
    return updated;
  }

  async update(context: TenantContext, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findOne(context, id);
    if (dto.status && appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Apenas agendamentos confirmados podem mudar de status.');
    }
    return this.prisma.appointment.update({
      where: { id },
      data: { notes: dto.notes, status: dto.status },
    });
  }

  private async assertBookable(
    tenantId: string,
    timezone: string,
    professionalId: string,
    date: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<void> {
    if (startsAt.getTime() <= Date.now()) {
      throw new BadRequestException('Não é possível agendar em um horário passado.');
    }

    const weekday = jsWeekdayOf(date, timezone);
    const businessHour = await this.prisma.businessHour.findFirst({ where: { tenantId, weekday, isActive: true } });
    if (!businessHour) {
      throw new BadRequestException('A barbearia não atende neste dia.');
    }
    const professionalHour = await this.prisma.professionalHour.findFirst({
      where: { tenantId, professionalId, weekday, isActive: true },
    });
    if (!professionalHour) {
      throw new BadRequestException('O profissional não atende neste dia.');
    }

    const windowStart = laterOf(
      localDateTimeToUtc(date, fromTimeDate(businessHour.startTime), timezone),
      localDateTimeToUtc(date, fromTimeDate(professionalHour.startTime), timezone),
    );
    const windowEnd = earlierOf(
      localDateTimeToUtc(date, fromTimeDate(businessHour.endTime), timezone),
      localDateTimeToUtc(date, fromTimeDate(professionalHour.endTime), timezone),
    );

    if (startsAt < windowStart || endsAt > windowEnd) {
      throw new BadRequestException('Horário fora do expediente.');
    }
  }
}
