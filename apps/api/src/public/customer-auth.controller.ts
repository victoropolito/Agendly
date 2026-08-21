import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { RefreshTokenDto } from '../auth/dto/refresh-token.dto';
import { CustomerAuthService } from './customer-auth.service';
import { type CustomerSessionRequest, CustomerSessionGuard } from './customer-session.guard';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Controller('public/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  register(@Body() dto: RegisterCustomerDto) {
    return this.customerAuthService.register(dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginCustomerDto) {
    return this.customerAuthService.login(dto);
  }

  @HttpCode(200)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.customerAuthService.refresh(dto.refreshToken);
  }

  @HttpCode(204)
  @Post('logout')
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.customerAuthService.logout(dto.refreshToken);
  }

  @UseGuards(CustomerSessionGuard)
  @Get('me')
  me(@Req() request: CustomerSessionRequest) {
    return this.customerAuthService.getProfile(request.customerUserId!);
  }

  @UseGuards(CustomerSessionGuard)
  @Get('me/barbershops')
  myBarbershops(@Req() request: CustomerSessionRequest) {
    return this.customerAuthService.listMyBarbershops(request.customerUserId!);
  }
}
