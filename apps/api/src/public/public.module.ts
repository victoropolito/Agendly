import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AppointmentModule } from '../appointments/appointment.module';
import { AvailabilityModule } from '../availability/availability.module';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthGuard } from './customer-auth.guard';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerController } from './customer.controller';
import { CustomerSessionGuard } from './customer-session.guard';
import { PublicAppointmentService } from './public-appointment.service';
import { PublicBarbershopsController } from './public-barbershops.controller';
import { PublicTenantController } from './public-tenant.controller';
import { TenantLookupService } from './tenant-lookup.service';

@Module({
  imports: [JwtModule.register({}), AvailabilityModule, AppointmentModule],
  controllers: [CustomerAuthController, PublicBarbershopsController, PublicTenantController, CustomerController],
  providers: [TenantLookupService, CustomerAuthService, CustomerAuthGuard, CustomerSessionGuard, PublicAppointmentService],
})
export class PublicModule {}
