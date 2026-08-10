import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { AccessTokenPayload } from './auth.types';

type RequestWithUser = Request & { user: AccessTokenPayload };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('tenant-register')
  registerTenant(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @HttpCode(204)
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() request: RequestWithUser) {
    return this.authService.getMe(request.user.sub, request.user.tenantId);
  }
}
