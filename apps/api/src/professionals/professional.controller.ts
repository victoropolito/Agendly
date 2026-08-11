import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { TenantRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../tenants/roles.decorator';
import { RolesGuard } from '../tenants/roles.guard';
import { TenantAccessGuard, type TenantRequest } from '../tenants/tenant-access.guard';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import { UpsertProfessionalHoursDto } from './dto/upsert-professional-hours.dto';
import { ProfessionalService } from './professional.service';

@Controller('professionals')
@UseGuards(JwtAuthGuard, TenantAccessGuard, RolesGuard)
export class ProfessionalController {
  constructor(private readonly professionalService: ProfessionalService) {}

  @Get()
  findAll(@Req() request: TenantRequest) {
    return this.professionalService.findAll(request.tenantContext!);
  }

  @Get(':id')
  findOne(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.professionalService.findOne(request.tenantContext!, id);
  }

  @Post()
  @Roles(TenantRole.ADMIN)
  create(@Req() request: TenantRequest, @Body() dto: CreateProfessionalDto) {
    return this.professionalService.create(request.tenantContext!, dto);
  }

  @Patch(':id')
  @Roles(TenantRole.ADMIN)
  update(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProfessionalDto) {
    return this.professionalService.update(request.tenantContext!, id, dto);
  }

  @Get(':id/hours')
  getHours(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.professionalService.getHours(request.tenantContext!, id);
  }

  @Put(':id/hours')
  @Roles(TenantRole.ADMIN)
  updateHours(
    @Req() request: TenantRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertProfessionalHoursDto,
  ) {
    return this.professionalService.updateHours(request.tenantContext!, id, dto);
  }
}
