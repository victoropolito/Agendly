import { Controller, Get } from '@nestjs/common';
import { TenantStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

/** The public directory — every active barbershop on the platform, browsable without an account. */
@Controller('public/barbershops')
export class PublicBarbershopsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.tenant.findMany({
      where: { status: TenantStatus.ACTIVE },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, description: true, address: true, logoUrl: true },
    });
  }
}
