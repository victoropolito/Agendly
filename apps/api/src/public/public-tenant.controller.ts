import { Controller, Get, Param, Query } from '@nestjs/common';

import { AvailabilityService } from '../availability/availability.service';
import { GetAvailabilityDto } from '../availability/dto/get-availability.dto';
import { PrismaService } from '../prisma/prisma.service';
import { TenantLookupService } from './tenant-lookup.service';

@Controller('public/barbershops/:slug')
export class PublicTenantController {
  constructor(
    private readonly tenantLookup: TenantLookupService,
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Get()
  async getTenant(@Param('slug') slug: string) {
    const tenant = await this.tenantLookup.resolveActiveBySlug(slug);
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      timezone: tenant.timezone,
      phone: tenant.phone,
      description: tenant.description,
      address: tenant.address,
      logoUrl: tenant.logoUrl,
    };
  }

  @Get('services')
  async getServices(@Param('slug') slug: string) {
    const tenant = await this.tenantLookup.resolveActiveBySlug(slug);
    return this.prisma.service.findMany({
      where: { tenantId: tenant.id, isActive: true, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, priceCents: true, durationMinutes: true },
    });
  }

  @Get('professionals')
  async getProfessionals(@Param('slug') slug: string) {
    const tenant = await this.tenantLookup.resolveActiveBySlug(slug);
    return this.prisma.professional.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, services: { select: { serviceId: true } } },
    });
  }

  @Get('availability')
  async getAvailability(@Param('slug') slug: string, @Query() dto: GetAvailabilityDto) {
    const tenant = await this.tenantLookup.resolveActiveBySlug(slug);
    const context = { tenantId: tenant.id, userId: '', roles: [] };
    return this.availabilityService.getAvailability(context, dto);
  }
}
