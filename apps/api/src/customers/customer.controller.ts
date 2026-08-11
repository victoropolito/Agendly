import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TenantRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../tenants/roles.decorator';
import { RolesGuard } from '../tenants/roles.guard';
import { TenantAccessGuard, type TenantRequest } from '../tenants/tenant-access.guard';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, TenantAccessGuard, RolesGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  findAll(@Req() request: TenantRequest, @Query('search') search?: string) {
    return this.customerService.findAll(request.tenantContext!, search);
  }

  @Get(':id')
  findOne(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.findOne(request.tenantContext!, id);
  }

  @Post()
  create(@Req() request: TenantRequest, @Body() dto: CreateCustomerDto) {
    return this.customerService.create(request.tenantContext!, dto);
  }

  @Patch(':id')
  @Roles(TenantRole.ADMIN)
  update(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto) {
    return this.customerService.update(request.tenantContext!, id, dto);
  }
}
