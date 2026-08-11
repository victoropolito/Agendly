import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { TenantRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../tenants/roles.decorator';
import { RolesGuard } from '../tenants/roles.guard';
import { TenantAccessGuard, type TenantRequest } from '../tenants/tenant-access.guard';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceService } from './service.service';

@Controller('services')
@UseGuards(JwtAuthGuard, TenantAccessGuard, RolesGuard)
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Get()
  findAll(@Req() request: TenantRequest) {
    return this.serviceService.findAll(request.tenantContext!);
  }

  @Get(':id')
  findOne(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.serviceService.findOne(request.tenantContext!, id);
  }

  @Post()
  @Roles(TenantRole.ADMIN)
  create(@Req() request: TenantRequest, @Body() dto: CreateServiceDto) {
    return this.serviceService.create(request.tenantContext!, dto);
  }

  @Patch(':id')
  @Roles(TenantRole.ADMIN)
  update(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceDto) {
    return this.serviceService.update(request.tenantContext!, id, dto);
  }
}
