import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DateTime } from 'luxon';

import { SLOT_STEP_MINUTES } from '../common/scheduling.constants';
import { fromTimeDate } from '../common/time.util';
import { earlierOf, isValidDateString, jsWeekdayOf, laterOf, localDateTimeToUtc } from '../common/tenant-time.util';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from '../tenants/tenant-context';
import { GetAvailabilityDto } from './dto/get-availability.dto';

interface Interval {
  start: Date;
  end: Date;
}

export interface ProfessionalAvailability {
  professionalId: string;
  name: string;
  slots: string[];
}

export interface AvailabilityResult {
  date: string;
  serviceId: string;
  durationMinutes: number;
  professionals: ProfessionalAvailability[];
  alternatives?: ProfessionalAvailability[];
}

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailability(context: TenantContext, dto: GetAvailabilityDto): Promise<AvailabilityResult> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } });

    if (!isValidDateString(dto.date)) {
      throw new BadRequestException('Data inválida.');
    }

    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, tenantId: context.tenantId, isActive: true, deletedAt: null },
    });
    if (!service) {
      throw new NotFoundException('Serviço não encontrado.');
    }

    let requestedProfessional: { id: string; name: string } | null = null;
    let candidateIds: string[];

    if (dto.professionalId) {
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
      requestedProfessional = { id: professional.id, name: professional.name };
      candidateIds = [professional.id];
    } else {
      const professionals = await this.prisma.professional.findMany({
        where: { tenantId: context.tenantId, isActive: true, services: { some: { serviceId: dto.serviceId } } },
      });
      candidateIds = professionals.map((professional) => professional.id);
    }

    const professionals =
      dto.professionalId && requestedProfessional
        ? [requestedProfessional]
        : await this.prisma.professional.findMany({
            where: { id: { in: candidateIds } },
            select: { id: true, name: true },
          });

    const slotsByProfessional = await this.computeSlotsForProfessionals(
      context,
      tenant,
      candidateIds,
      dto.date,
      service.durationMinutes,
    );

    const result: ProfessionalAvailability[] = professionals.map((professional) => ({
      professionalId: professional.id,
      name: professional.name,
      slots: slotsByProfessional.get(professional.id) ?? [],
    }));

    const response: AvailabilityResult = {
      date: dto.date,
      serviceId: dto.serviceId,
      durationMinutes: service.durationMinutes,
      professionals: result,
    };

    if (dto.professionalId && result.every((entry) => entry.slots.length === 0)) {
      const alternativeCandidates = await this.prisma.professional.findMany({
        where: {
          tenantId: context.tenantId,
          isActive: true,
          id: { not: dto.professionalId },
          services: { some: { serviceId: dto.serviceId } },
        },
        select: { id: true, name: true },
      });
      const alternativeSlots = await this.computeSlotsForProfessionals(
        context,
        tenant,
        alternativeCandidates.map((professional) => professional.id),
        dto.date,
        service.durationMinutes,
      );
      response.alternatives = alternativeCandidates
        .map((professional) => ({
          professionalId: professional.id,
          name: professional.name,
          slots: alternativeSlots.get(professional.id) ?? [],
        }))
        .filter((entry) => entry.slots.length > 0);
    }

    return response;
  }

  async pickAvailableProfessional(
    context: TenantContext,
    params: { serviceId: string; date: string; startTime: string },
  ): Promise<{ professionalId: string; name: string } | null> {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } });
    const service = await this.prisma.service.findFirst({
      where: { id: params.serviceId, tenantId: context.tenantId, isActive: true, deletedAt: null },
    });
    if (!service) {
      return null;
    }

    const professionals = await this.prisma.professional.findMany({
      where: { tenantId: context.tenantId, isActive: true, services: { some: { serviceId: params.serviceId } } },
      select: { id: true, name: true },
    });
    const slotsByProfessional = await this.computeSlotsForProfessionals(
      context,
      tenant,
      professionals.map((professional) => professional.id),
      params.date,
      service.durationMinutes,
    );

    for (const professional of professionals) {
      if ((slotsByProfessional.get(professional.id) ?? []).includes(params.startTime)) {
        return { professionalId: professional.id, name: professional.name };
      }
    }
    return null;
  }

  private async computeSlotsForProfessionals(
    context: TenantContext,
    tenant: { timezone: string },
    professionalIds: string[],
    date: string,
    durationMinutes: number,
  ): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();
    if (professionalIds.length === 0) {
      return result;
    }

    const weekday = jsWeekdayOf(date, tenant.timezone);

    const businessHour = await this.prisma.businessHour.findFirst({
      where: { tenantId: context.tenantId, weekday, isActive: true },
    });
    if (!businessHour) {
      professionalIds.forEach((id) => result.set(id, []));
      return result;
    }

    const professionalHours = await this.prisma.professionalHour.findMany({
      where: { tenantId: context.tenantId, professionalId: { in: professionalIds }, weekday, isActive: true },
    });
    const hoursByProfessional = new Map(professionalHours.map((hour) => [hour.professionalId, hour]));

    const dayStartUtc = DateTime.fromISO(date, { zone: tenant.timezone }).startOf('day').toUTC().toJSDate();
    const dayEndUtc = DateTime.fromISO(date, { zone: tenant.timezone }).endOf('day').toUTC().toJSDate();
    const entries = await this.prisma.scheduleEntry.findMany({
      where: {
        tenantId: context.tenantId,
        professionalId: { in: professionalIds },
        startsAt: { lt: dayEndUtc },
        endsAt: { gt: dayStartUtc },
      },
    });
    const entriesByProfessional = new Map<string, Interval[]>();
    for (const entry of entries) {
      const list = entriesByProfessional.get(entry.professionalId) ?? [];
      list.push({ start: entry.startsAt, end: entry.endsAt });
      entriesByProfessional.set(entry.professionalId, list);
    }

    const now = new Date();

    for (const professionalId of professionalIds) {
      const professionalHour = hoursByProfessional.get(professionalId);
      if (!professionalHour) {
        result.set(professionalId, []);
        continue;
      }

      const windowStart = laterOf(
        localDateTimeToUtc(date, fromTimeDate(businessHour.startTime), tenant.timezone),
        localDateTimeToUtc(date, fromTimeDate(professionalHour.startTime), tenant.timezone),
      );
      const windowEnd = earlierOf(
        localDateTimeToUtc(date, fromTimeDate(businessHour.endTime), tenant.timezone),
        localDateTimeToUtc(date, fromTimeDate(professionalHour.endTime), tenant.timezone),
      );

      const slots: string[] = [];
      const occupied = entriesByProfessional.get(professionalId) ?? [];
      let cursor = windowStart.getTime();
      const stepMs = SLOT_STEP_MINUTES * 60_000;
      const durationMs = durationMinutes * 60_000;

      while (cursor + durationMs <= windowEnd.getTime()) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor + durationMs);
        const inPast = slotStart.getTime() <= now.getTime();
        const overlaps = occupied.some((interval) => slotStart < interval.end && slotEnd > interval.start);
        if (!inPast && !overlaps) {
          slots.push(DateTime.fromJSDate(slotStart, { zone: 'utc' }).setZone(tenant.timezone).toFormat('HH:mm'));
        }
        cursor += stepMs;
      }

      result.set(professionalId, slots);
    }

    return result;
  }
}
