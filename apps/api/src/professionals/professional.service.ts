import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { fromTimeDate, toTimeDate } from '../common/time.util';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from '../tenants/tenant-context';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { UpsertProfessionalHoursDto } from './dto/upsert-professional-hours.dto';

@Injectable()
export class ProfessionalService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(context: TenantContext) {
    return this.prisma.professional.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { name: 'asc' },
      include: { services: { select: { serviceId: true } } },
    });
  }

  async findOne(context: TenantContext, id: string) {
    const professional = await this.prisma.professional.findFirst({
      where: { id, tenantId: context.tenantId },
      include: { services: { select: { serviceId: true } } },
    });
    if (!professional) {
      throw new NotFoundException();
    }
    return professional;
  }

  async create(context: TenantContext, dto: CreateProfessionalDto) {
    await this.assertServicesBelongToTenant(context, dto.serviceIds);

    const professional = await this.prisma.professional.create({
      data: {
        tenantId: context.tenantId,
        name: dto.name,
        phone: dto.phone,
        photoUrl: dto.photoUrl,
        isActive: dto.isActive ?? true,
        services: dto.serviceIds
          ? { create: dto.serviceIds.map((serviceId) => ({ tenantId: context.tenantId, serviceId })) }
          : undefined,
      },
      include: { services: { select: { serviceId: true } } },
    });
    return professional;
  }

  async update(context: TenantContext, id: string, dto: UpdateProfessionalDto) {
    await this.findOne(context, id);
    await this.assertServicesBelongToTenant(context, dto.serviceIds);

    return this.prisma.$transaction(async (tx) => {
      if (dto.serviceIds) {
        await tx.professionalService.deleteMany({ where: { professionalId: id } });
        if (dto.serviceIds.length > 0) {
          await tx.professionalService.createMany({
            data: dto.serviceIds.map((serviceId) => ({ tenantId: context.tenantId, professionalId: id, serviceId })),
          });
        }
      }

      return tx.professional.update({
        where: { id },
        data: {
          name: dto.name,
          phone: dto.phone,
          photoUrl: dto.photoUrl,
          isActive: dto.isActive,
        },
        include: { services: { select: { serviceId: true } } },
      });
    });
  }

  async getHours(context: TenantContext, professionalId: string) {
    await this.findOne(context, professionalId);
    const hours = await this.prisma.professionalHour.findMany({
      where: { tenantId: context.tenantId, professionalId },
      orderBy: { weekday: 'asc' },
    });
    return hours.map((hour) => this.toHourResponse(hour));
  }

  async updateHours(context: TenantContext, professionalId: string, dto: UpsertProfessionalHoursDto) {
    await this.findOne(context, professionalId);

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
      await tx.professionalHour.deleteMany({ where: { tenantId: context.tenantId, professionalId } });
      if (dto.hours.length > 0) {
        await tx.professionalHour.createMany({
          data: dto.hours.map((entry) => ({
            tenantId: context.tenantId,
            professionalId,
            weekday: entry.weekday,
            startTime: toTimeDate(entry.startTime),
            endTime: toTimeDate(entry.endTime),
            isActive: entry.isActive ?? true,
          })),
        });
      }
    });

    return this.getHours(context, professionalId);
  }

  private async assertServicesBelongToTenant(context: TenantContext, serviceIds: string[] | undefined): Promise<void> {
    if (!serviceIds || serviceIds.length === 0) {
      return;
    }
    const found = await this.prisma.service.findMany({
      where: { id: { in: serviceIds }, tenantId: context.tenantId },
      select: { id: true },
    });
    if (found.length !== new Set(serviceIds).size) {
      throw new BadRequestException('Um ou mais serviços informados não pertencem a esta barbearia.');
    }
  }

  private toHourResponse(hour: { id: string; weekday: number; startTime: Date; endTime: Date; isActive: boolean }) {
    return {
      id: hour.id,
      weekday: hour.weekday,
      startTime: fromTimeDate(hour.startTime),
      endTime: fromTimeDate(hour.endTime),
      isActive: hour.isActive,
    };
  }
}
