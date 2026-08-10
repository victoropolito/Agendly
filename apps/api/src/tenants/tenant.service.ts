import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from './tenant-context';
import { UpdateTenantDto } from './dto/update-tenant.dto';

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

  private isValidTimeZone(timeZone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone });
      return true;
    } catch {
      return false;
    }
  }
}
