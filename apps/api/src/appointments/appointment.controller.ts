import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AppointmentSource, TenantRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../tenants/roles.guard';
import { TenantAccessGuard, type TenantRequest } from '../tenants/tenant-access.guard';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { ListAppointmentsDto } from './dto/list-appointments.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('appointments')
@UseGuards(JwtAuthGuard, TenantAccessGuard, RolesGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Get()
  findAll(@Req() request: TenantRequest, @Query() filters: ListAppointmentsDto) {
    return this.appointmentService.findAll(request.tenantContext!, filters);
  }

  @Get(':id')
  findOne(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.findOne(request.tenantContext!, id);
  }

  @Post()
  create(@Req() request: TenantRequest, @Body() dto: CreateAppointmentDto) {
    const source = request.tenantContext!.roles.includes(TenantRole.ADMIN)
      ? AppointmentSource.ADMIN
      : AppointmentSource.PROFESSIONAL;
    return this.appointmentService.create(request.tenantContext!, dto, source);
  }

  @Patch(':id')
  update(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateAppointmentDto) {
    return this.appointmentService.update(request.tenantContext!, id, dto);
  }

  @Post(':id/cancel')
  cancel(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentService.cancel(request.tenantContext!, id);
  }

  @Post(':id/reschedule')
  reschedule(
    @Req() request: TenantRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentService.reschedule(request.tenantContext!, id, dto);
  }
}
