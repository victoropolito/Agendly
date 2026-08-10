import { Module } from '@nestjs/common';

import { RolesGuard } from './roles.guard';
import { TenantAccessGuard } from './tenant-access.guard';
import { TenantController } from './tenant.controller';
import { TenantService } from './tenant.service';

@Module({
  controllers: [TenantController],
  providers: [TenantService, TenantAccessGuard, RolesGuard],
  exports: [TenantAccessGuard, RolesGuard],
})
export class TenantModule {}
