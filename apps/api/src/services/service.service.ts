import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from '../tenants/tenant-context';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(context: TenantContext) {
    return this.prisma.service.findMany({
      where: { tenantId: context.tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(context: TenantContext, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId: context.tenantId, deletedAt: null },
    });
    if (!service) {
      throw new NotFoundException();
    }
    return service;
  }

  create(context: TenantContext, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        tenantId: context.tenantId,
        name: dto.name,
        description: dto.description,
        priceCents: dto.priceCents,
        durationMinutes: dto.durationMinutes,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(context: TenantContext, id: string, dto: UpdateServiceDto) {
    await this.findOne(context, id);
    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }
}
