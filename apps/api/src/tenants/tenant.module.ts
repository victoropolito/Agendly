import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsModule } from '../notifications/notifications.module';
import { RolesGuard } from './roles.guard';
import { TenantAccessGuard } from './tenant-access.guard';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [TenantController],
  providers: [TenantService, TenantAccessGuard, RolesGuard, JwtAuthGuard],
  exports: [AuthModule, TenantAccessGuard, RolesGuard, JwtAuthGuard],
})
export class TenantModule {}
