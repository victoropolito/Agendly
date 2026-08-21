import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { TenantRole } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StartEvolutionConnectionDto } from '../notifications/whatsapp/dto/start-evolution-connection.dto';
import { WhatsAppConnectionService } from '../notifications/whatsapp/whatsapp-connection.service';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { TenantAccessGuard, type TenantRequest } from './tenant-access.guard';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpsertBusinessHoursDto } from './dto/upsert-business-hours.dto';

@Controller('tenant/me')
@UseGuards(JwtAuthGuard, TenantAccessGuard, RolesGuard)
@Roles(TenantRole.ADMIN)
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly whatsAppConnectionService: WhatsAppConnectionService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  getCurrent(@Req() request: TenantRequest) {
    return this.tenantService.getCurrent(request.tenantContext!);
  }

  @Patch()
  updateCurrent(@Req() request: TenantRequest, @Body() dto: UpdateTenantDto) {
    return this.tenantService.updateCurrent(request.tenantContext!, dto);
  }

  @Get('business-hours')
  getBusinessHours(@Req() request: TenantRequest) {
    return this.tenantService.getBusinessHours(request.tenantContext!);
  }

  @Put('business-hours')
  updateBusinessHours(@Req() request: TenantRequest, @Body() dto: UpsertBusinessHoursDto) {
    return this.tenantService.updateBusinessHours(request.tenantContext!, dto);
  }

  @Get('whatsapp-connection')
  getWhatsAppConnection(@Req() request: TenantRequest) {
    return this.whatsAppConnectionService.getStatus(request.tenantContext!);
  }

  @Post('whatsapp-connection/evolution')
  startEvolutionWhatsApp(@Req() request: TenantRequest, @Body() dto: StartEvolutionConnectionDto) {
    return this.whatsAppConnectionService.startEvolutionConnection(request.tenantContext!, dto.phone);
  }

  @HttpCode(204)
  @Delete('whatsapp-connection')
  async disconnectWhatsApp(@Req() request: TenantRequest): Promise<void> {
    await this.whatsAppConnectionService.disconnect(request.tenantContext!);
  }

  /** Authorizes a direct-to-Cloudinary upload (logo or a professional's photo) from the browser. */
  @Post('upload-signature')
  getUploadSignature(@Req() request: TenantRequest) {
    return this.cloudinaryService.createUploadSignature(request.tenantContext!.tenantId);
  }
}
