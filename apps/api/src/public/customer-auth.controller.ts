import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';

import { RefreshTokenDto } from '../auth/dto/refresh-token.dto';
import { CustomerAuthService } from './customer-auth.service';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { RegisterCustomerDto } from './dto/register-customer.dto';

@Controller('public/barbershops/:slug/auth')
export class CustomerAuthController {
  constructor(private readonly customerAuthService: CustomerAuthService) {}

  @Post('register')
  register(@Param('slug') slug: string, @Body() dto: RegisterCustomerDto) {
    return this.customerAuthService.register(slug, dto);
  }

  @HttpCode(200)
  @Post('login')
  login(@Param('slug') slug: string, @Body() dto: LoginCustomerDto) {
    return this.customerAuthService.login(slug, dto);
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
}
