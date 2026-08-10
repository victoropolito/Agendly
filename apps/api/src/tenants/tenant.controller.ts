import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { TenantRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { TenantAccessGuard, type TenantRequest } from './tenant-access.guard';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('tenant/me')
@UseGuards(JwtAuthGuard, TenantAccessGuard, RolesGuard)
@Roles(TenantRole.ADMIN)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  getCurrent(@Req() request: TenantRequest) {
    return this.tenantService.getCurrent(request.tenantContext!);
  }

  @Patch()
  updateCurrent(@Req() request: TenantRequest, @Body() dto: UpdateTenantDto) {
    return this.tenantService.updateCurrent(request.tenantContext!, dto);
  }
}
