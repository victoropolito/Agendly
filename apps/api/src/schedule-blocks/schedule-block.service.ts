import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ScheduleEntryKind } from '@prisma/client';
import { DateTime } from 'luxon';

import { isScheduleConflictError } from '../common/schedule-conflict.util';
import { isValidDateString, localDateTimeToUtc } from '../common/tenant-time.util';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from '../tenants/tenant-context';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';
import { ListScheduleBlocksDto } from './dto/list-schedule-blocks.dto';

@Injectable()
export class ScheduleBlockService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(context: TenantContext, filters: ListScheduleBlocksDto) {
    const where: Record<string, unknown> = { tenantId: context.tenantId };
    if (filters.professionalId) {
      where.professionalId = filters.professionalId;
    }
    if (filters.date) {
      if (!isValidDateString(filters.date)) {
        throw new BadRequestException('Data inválida.');
      }
      const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } });
      where.startsAt = { lt: DateTime.fromISO(filters.date, { zone: tenant.timezone }).endOf('day').toUTC().toJSDate() };
      where.endsAt = { gt: DateTime.fromISO(filters.date, { zone: tenant.timezone }).startOf('day').toUTC().toJSDate() };
    }

    return this.prisma.scheduleBlock.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: { professional: { select: { id: true, name: true } } },
    });
  }

  async create(context: TenantContext, dto: CreateScheduleBlockDto) {
    if (!isValidDateString(dto.date)) {
      throw new BadRequestException('Data inválida.');
    }
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Horário de início deve ser anterior ao horário de término.');
    }

    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } });
    const professional = await this.prisma.professional.findFirst({
      where: { id: dto.professionalId, tenantId: context.tenantId },
    });
    if (!professional) {
      throw new NotFoundException('Profissional não encontrado.');
    }

    const startsAt = localDateTimeToUtc(dto.date, dto.startTime, tenant.timezone);
    const endsAt = localDateTimeToUtc(dto.date, dto.endTime, tenant.timezone);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const block = await tx.scheduleBlock.create({
          data: { tenantId: context.tenantId, professionalId: professional.id, startsAt, endsAt, reason: dto.reason },
        });
        await tx.scheduleEntry.create({
          data: {
            tenantId: context.tenantId,
            professionalId: professional.id,
            scheduleBlockId: block.id,
            kind: ScheduleEntryKind.BLOCK,
            startsAt,
            endsAt,
          },
        });
        return block;
      });
    } catch (error) {
      if (isScheduleConflictError(error)) {
        throw new ConflictException({
          statusCode: 409,
          code: 'APPOINTMENT_SLOT_UNAVAILABLE',
          message: 'Este intervalo conflita com um agendamento ou bloqueio existente.',
        });
      }
      throw error;
    }
  }

  async remove(context: TenantContext, id: string): Promise<void> {
    const block = await this.prisma.scheduleBlock.findFirst({ where: { id, tenantId: context.tenantId } });
    if (!block) {
      throw new NotFoundException();
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.scheduleEntry.deleteMany({ where: { scheduleBlockId: id } });
      await tx.scheduleBlock.delete({ where: { id } });
    });
  }
}
