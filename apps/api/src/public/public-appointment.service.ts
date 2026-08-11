import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentSource } from '@prisma/client';

import { AppointmentService } from '../appointments/appointment.service';
import { RescheduleAppointmentDto } from '../appointments/dto/reschedule-appointment.dto';
import { AvailabilityService } from '../availability/availability.service';
import type { TenantContext } from '../tenants/tenant-context';
import type { CustomerContext } from './customer-auth.types';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';

@Injectable()
export class PublicAppointmentService {
  constructor(
    private readonly appointmentService: AppointmentService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async findMine(customer: CustomerContext) {
    return this.appointmentService.findAll(this.toTenantContext(customer), { customerId: customer.customerId });
  }

  async findMineOne(customer: CustomerContext, id: string) {
    const appointment = await this.appointmentService.findOne(this.toTenantContext(customer), id);
    if (appointment.customerId !== customer.customerId) {
      throw new NotFoundException();
    }
    return appointment;
  }

  async create(customer: CustomerContext, dto: CreatePublicAppointmentDto) {
    const context = this.toTenantContext(customer);
    let professionalId = dto.professionalId;

    if (!professionalId) {
      const picked = await this.availabilityService.pickAvailableProfessional(context, {
        serviceId: dto.serviceId,
        date: dto.date,
        startTime: dto.startTime,
      });
      if (!picked) {
        throw new ConflictException({
          statusCode: 409,
          code: 'APPOINTMENT_SLOT_UNAVAILABLE',
          message: 'Nenhum profissional disponível neste horário. Escolha outro horário.',
        });
      }
      professionalId = picked.professionalId;
    }

    return this.appointmentService.create(
      context,
      {
        customerId: customer.customerId,
        professionalId,
        serviceId: dto.serviceId,
        date: dto.date,
        startTime: dto.startTime,
        notes: dto.notes,
      },
      AppointmentSource.PUBLIC,
    );
  }

  async cancel(customer: CustomerContext, id: string) {
    await this.findMineOne(customer, id);
    return this.appointmentService.cancel(this.toTenantContext(customer), id);
  }

  async reschedule(customer: CustomerContext, id: string, dto: RescheduleAppointmentDto) {
    await this.findMineOne(customer, id);
    return this.appointmentService.reschedule(this.toTenantContext(customer), id, dto);
  }

  private toTenantContext(customer: CustomerContext): TenantContext {
    return { tenantId: customer.tenantId, userId: customer.userId, roles: [] };
  }
}
