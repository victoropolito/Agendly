import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { TenantAccessGuard } from './tenant-access.guard';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantController],
  providers: [TenantService, TenantAccessGuard, RolesGuard, JwtAuthGuard],
  exports: [AuthModule, TenantAccessGuard, RolesGuard, JwtAuthGuard],
})
export class TenantModule {}
