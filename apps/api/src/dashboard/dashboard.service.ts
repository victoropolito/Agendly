import { Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { DateTime } from 'luxon';

import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from '../tenants/tenant-context';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(context: TenantContext) {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({ where: { id: context.tenantId } });
    const now = DateTime.now().setZone(tenant.timezone);
    const todayStart = now.startOf('day').toUTC().toJSDate();
    const todayEnd = now.endOf('day').toUTC().toJSDate();
    const monthStart = now.startOf('month').toUTC().toJSDate();
    const monthEnd = now.endOf('month').toUTC().toJSDate();

    const [
      todayAppointments,
      upcomingAppointments,
      customersCount,
      professionalsCount,
      servicesCount,
      monthAppointments,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          tenantId: context.tenantId,
          status: AppointmentStatus.CONFIRMED,
          startsAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.appointment.findMany({
        where: { tenantId: context.tenantId, status: AppointmentStatus.CONFIRMED, startsAt: { gte: now.toUTC().toJSDate() } },
        orderBy: { startsAt: 'asc' },
        take: 5,
        include: {
          customer: { select: { id: true, name: true } },
          professional: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
        },
      }),
      this.prisma.customer.count({ where: { tenantId: context.tenantId } }),
      this.prisma.professional.count({ where: { tenantId: context.tenantId, isActive: true } }),
      this.prisma.service.count({ where: { tenantId: context.tenantId, isActive: true, deletedAt: null } }),
      this.prisma.appointment.findMany({
        where: {
          tenantId: context.tenantId,
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED] },
          startsAt: { gte: monthStart, lte: monthEnd },
        },
        select: { priceCentsSnapshot: true },
      }),
    ]);

    const estimatedRevenueCents = monthAppointments.reduce((sum, appointment) => sum + appointment.priceCentsSnapshot, 0);

    return {
      todayAppointmentsCount: todayAppointments,
      upcomingAppointments,
      customersCount,
      professionalsCount,
      servicesCount,
      estimatedRevenue: {
        periodStart: monthStart,
        periodEnd: monthEnd,
        totalCents: estimatedRevenueCents,
      },
    };
  }
}
