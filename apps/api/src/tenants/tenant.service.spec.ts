import { BadRequestException } from '@nestjs/common';

import { TenantService } from './tenant.service';

describe('TenantService.updateBusinessHours', () => {
  const context = { tenantId: 'tenant-a', userId: 'user-a', roles: [] };

  it('rejects the same weekday listed twice', async () => {
    const prisma = { businessHour: { findMany: jest.fn() } };
    const service = new TenantService(prisma as never);

    await expect(
      service.updateBusinessHours(context, {
        hours: [
          { weekday: 1, startTime: '09:00', endTime: '18:00' },
          { weekday: 1, startTime: '09:00', endTime: '12:00' },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a start time that is not before the end time', async () => {
    const prisma = { businessHour: { findMany: jest.fn() } };
    const service = new TenantService(prisma as never);

    await expect(
      service.updateBusinessHours(context, { hours: [{ weekday: 1, startTime: '18:00', endTime: '09:00' }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
