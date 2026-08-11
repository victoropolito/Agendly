import { NotFoundException } from '@nestjs/common';

import { ServiceService } from './service.service';

describe('ServiceService', () => {
  const context = { tenantId: 'tenant-a', userId: 'user-a', roles: [] };

  it('scopes findOne to the current tenant and rejects records from another tenant', async () => {
    const prisma = { service: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new ServiceService(prisma as never);

    await expect(service.findOne(context, 'service-from-tenant-b')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.service.findFirst).toHaveBeenCalledWith({
      where: { id: 'service-from-tenant-b', tenantId: 'tenant-a', deletedAt: null },
    });
  });

  it('creates a service scoped to the current tenant', async () => {
    const prisma = { service: { create: jest.fn().mockResolvedValue({ id: 'service-1' }) } };
    const service = new ServiceService(prisma as never);

    await service.create(context, { name: 'Corte', priceCents: 3500, durationMinutes: 30 });

    expect(prisma.service.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tenantId: 'tenant-a', name: 'Corte', isActive: true }),
    });
  });
});
