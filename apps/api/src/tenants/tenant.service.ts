import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { fromTimeDate, toTimeDate } from '../common/time.util';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from './tenant-context';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpsertBusinessHoursDto } from './dto/upsert-business-hours.dto';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(context: TenantContext) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        timezone: true,
        phone: true,
        email: true,
        description: true,
        address: true,
        logoUrl: true,
        status: true,
      },
    });
    if (!tenant) {
      throw new NotFoundException();
    }
    return tenant;
  }

  async updateCurrent(context: TenantContext, dto: UpdateTenantDto) {
    if (dto.timezone && !this.isValidTimeZone(dto.timezone)) {
      throw new BadRequestException('Fuso horário inválido.');
    }
    return this.prisma.tenant.update({
      where: { id: context.tenantId },
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        timezone: true,
        phone: true,
        email: true,
        description: true,
        address: true,
        logoUrl: true,
        status: true,
      },
    });
  }

  async getBusinessHours(context: TenantContext) {
    const hours = await this.prisma.businessHour.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { weekday: 'asc' },
    });
    return hours.map((hour) => this.toBusinessHourResponse(hour));
  }

  async updateBusinessHours(context: TenantContext, dto: UpsertBusinessHoursDto) {
    const weekdaysSeen = new Set<number>();
    for (const entry of dto.hours) {
      if (weekdaysSeen.has(entry.weekday)) {
        throw new BadRequestException(`Dia da semana ${entry.weekday} informado mais de uma vez.`);
      }
      weekdaysSeen.add(entry.weekday);
      if (entry.startTime >= entry.endTime) {
        throw new BadRequestException('Horário de início deve ser anterior ao horário de término.');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.businessHour.deleteMany({ where: { tenantId: context.tenantId } });
      if (dto.hours.length > 0) {
        await tx.businessHour.createMany({
          data: dto.hours.map((entry) => ({
            tenantId: context.tenantId,
            weekday: entry.weekday,
            startTime: toTimeDate(entry.startTime),
            endTime: toTimeDate(entry.endTime),
            isActive: entry.isActive ?? true,
          })),
        });
      }
    });

    return this.getBusinessHours(context);
  }

  private toBusinessHourResponse(hour: { id: string; weekday: number; startTime: Date; endTime: Date; isActive: boolean }) {
    return {
      id: hour.id,
      weekday: hour.weekday,
      startTime: fromTimeDate(hour.startTime),
      endTime: fromTimeDate(hour.endTime),
      isActive: hour.isActive,
    };
  }

  private isValidTimeZone(timeZone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone });
      return true;
    } catch {
      return false;
    }
  }
}
