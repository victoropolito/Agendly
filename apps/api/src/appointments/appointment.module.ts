import { Module } from '@nestjs/common';

import { NotificationsModule } from '../notifications/notifications.module';
import { TenantModule } from '../tenants/tenant.module';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

@Module({
  imports: [TenantModule, NotificationsModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
