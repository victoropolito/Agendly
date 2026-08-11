import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentSource } from '@prisma/client';

import { AppointmentService } from './appointment.service';

describe('AppointmentService', () => {
  const context = { tenantId: 'tenant-a', userId: 'user-a', roles: [] };
  const notificationsQueue = { enqueueAppointmentEvent: jest.fn() };

  it('scopes findOne to the current tenant and rejects records from another tenant', async () => {
    const prisma = { appointment: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new AppointmentService(prisma as never, notificationsQueue as never);

    await expect(service.findOne(context, 'appointment-from-tenant-b')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'appointment-from-tenant-b', tenantId: 'tenant-a' } }),
    );
  });

  it('rejects creating an appointment for a customer that does not belong to the tenant', async () => {
    const prisma = {
      tenant: { findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'tenant-a', timezone: 'America/Sao_Paulo' }) },
      customer: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new AppointmentService(prisma as never, notificationsQueue as never);

    await expect(
      service.create(
        context,
        {
          customerId: 'customer-from-tenant-b',
          professionalId: 'professional-1',
          serviceId: 'service-1',
          date: '2099-01-01',
          startTime: '10:00',
        },
        AppointmentSource.ADMIN,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects an invalid date format before touching the database', async () => {
    const prisma = { tenant: { findUniqueOrThrow: jest.fn() } };
    const service = new AppointmentService(prisma as never, notificationsQueue as never);

    await expect(
      service.create(
        context,
        {
          customerId: 'customer-1',
          professionalId: 'professional-1',
          serviceId: 'service-1',
          date: '2099-13-40',
          startTime: '10:00',
        },
        AppointmentSource.ADMIN,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.tenant.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('rejects cancelling an appointment that is not confirmed', async () => {
    const prisma = {
      appointment: { findFirst: jest.fn().mockResolvedValue({ id: 'appointment-1', status: 'CANCELLED' }) },
    };
    const service = new AppointmentService(prisma as never, notificationsQueue as never);

    await expect(service.cancel(context, 'appointment-1')).rejects.toBeInstanceOf(BadRequestException);
  });
});
