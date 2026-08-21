import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import type { CustomerAccessTokenPayload } from './customer-auth.types';

export type CustomerSessionRequest = Request & { customerUserId?: string };

/**
 * Verifies the customer's global session without resolving any barbershop — used by the
 * tenant-agnostic `/public/auth/me*` routes. `CustomerAuthGuard` (which also auto-provisions a
 * `Customer` profile for a specific `:slug`) handles everything that's scoped to one barbershop.
 */
@Injectable()
export class CustomerSessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CustomerSessionRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<CustomerAccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_CUSTOMER_ACCESS_SECRET'),
      });
      request.customerUserId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado.');
    }
  }
}
