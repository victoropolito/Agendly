import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Body, Query, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../tenants/roles.guard';
import { TenantAccessGuard, type TenantRequest } from '../tenants/tenant-access.guard';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto';
import { ListScheduleBlocksDto } from './dto/list-schedule-blocks.dto';
import { ScheduleBlockService } from './schedule-block.service';

@Controller('schedule-blocks')
@UseGuards(JwtAuthGuard, TenantAccessGuard, RolesGuard)
export class ScheduleBlockController {
  constructor(private readonly scheduleBlockService: ScheduleBlockService) {}

  @Get()
  findAll(@Req() request: TenantRequest, @Query() filters: ListScheduleBlocksDto) {
    return this.scheduleBlockService.findAll(request.tenantContext!, filters);
  }

  @Post()
  create(@Req() request: TenantRequest, @Body() dto: CreateScheduleBlockDto) {
    return this.scheduleBlockService.create(request.tenantContext!, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() request: TenantRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleBlockService.remove(request.tenantContext!, id);
  }
}
