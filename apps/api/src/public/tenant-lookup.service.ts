import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantLookupService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveActiveBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug, status: TenantStatus.ACTIVE },
    });
    if (!tenant) {
      throw new NotFoundException('Barbearia não encontrada.');
    }
    return tenant;
  }
}
