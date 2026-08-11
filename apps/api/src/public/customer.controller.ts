import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';

import { RescheduleAppointmentDto } from '../appointments/dto/reschedule-appointment.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerAuthGuard, type CustomerRequest } from './customer-auth.guard';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';
import { PublicAppointmentService } from './public-appointment.service';

@Controller('public/barbershops/:slug/me')
@UseGuards(CustomerAuthGuard)
export class CustomerController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly publicAppointmentService: PublicAppointmentService,
  ) {}

  @Get()
  async me(@Req() request: CustomerRequest) {
    const customer = request.customerContext!;
    const record = await this.prisma.customer.findUniqueOrThrow({ where: { id: customer.customerId } });
    return { id: record.id, name: record.name, phone: record.phoneNormalized, email: record.email };
  }

  @Get('appointments')
  findMyAppointments(@Req() request: CustomerRequest) {
    return this.publicAppointmentService.findMine(request.customerContext!);
  }

  @Post('appointments')
  createAppointment(@Req() request: CustomerRequest, @Body() dto: CreatePublicAppointmentDto) {
    return this.publicAppointmentService.create(request.customerContext!, dto);
  }

  @Post('appointments/:id/cancel')
  cancelAppointment(@Req() request: CustomerRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.publicAppointmentService.cancel(request.customerContext!, id);
  }

  @Post('appointments/:id/reschedule')
  rescheduleAppointment(
    @Req() request: CustomerRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.publicAppointmentService.reschedule(request.customerContext!, id, dto);
  }
}
