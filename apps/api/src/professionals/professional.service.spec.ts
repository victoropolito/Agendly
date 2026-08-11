import { BadRequestException, NotFoundException } from '@nestjs/common';

import { ProfessionalService } from './professional.service';

describe('ProfessionalService', () => {
  const context = { tenantId: 'tenant-a', userId: 'user-a', roles: [] };

  it('scopes findOne to the current tenant and rejects records from another tenant', async () => {
    const prisma = { professional: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new ProfessionalService(prisma as never);

    await expect(service.findOne(context, 'professional-from-tenant-b')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.professional.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'professional-from-tenant-b', tenantId: 'tenant-a' } }),
    );
  });

  it('rejects linking a service that does not belong to the tenant', async () => {
    const prisma = {
      service: { findMany: jest.fn().mockResolvedValue([]) },
      professional: { create: jest.fn() },
    };
    const service = new ProfessionalService(prisma as never);

    await expect(
      service.create(context, { name: 'João', serviceIds: ['service-from-tenant-b'] }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.professional.create).not.toHaveBeenCalled();
  });

  it('rejects duplicate weekdays when upserting hours', async () => {
    const prisma = {
      professional: { findFirst: jest.fn().mockResolvedValue({ id: 'professional-1' }) },
    };
    const service = new ProfessionalService(prisma as never);

    await expect(
      service.updateHours(context, 'professional-1', {
        hours: [
          { weekday: 1, startTime: '09:00', endTime: '18:00' },
          { weekday: 1, startTime: '09:00', endTime: '12:00' },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
