import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Customer } from '@prisma/client';
import type { Request } from 'express';

import { PrismaService } from '../prisma/prisma.service';
import type { CustomerAccessTokenPayload, CustomerContext } from './customer-auth.types';
import { TenantLookupService } from './tenant-lookup.service';

export type CustomerRequest = Request & { customerContext?: CustomerContext };

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tenantLookup: TenantLookupService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CustomerRequest>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    let payload: CustomerAccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<CustomerAccessTokenPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_CUSTOMER_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Token de acesso inválido ou expirado.');
    }

    const slug = Array.isArray(request.params.slug) ? request.params.slug[0] : request.params.slug;
    const tenant = await this.tenantLookup.resolveActiveBySlug(slug);

    const customer = await this.findOrCreateCustomer(tenant.id, payload.sub);

    request.customerContext = {
      tenantId: tenant.id,
      userId: payload.sub,
      customerId: customer.id,
      customerName: customer.name,
    };
    return true;
  }

  /**
   * The customer session is global — the first time an authenticated customer touches a given
   * barbershop, we silently provision their `Customer` profile there instead of requiring a
   * separate sign-up per shop. Only ever creates a fresh row keyed by (tenantId, userId); never
   * matches an existing walk-in `Customer` (userId: null) by phone/email, since that number could
   * have belonged to someone else and auto-linking would leak that stranger's booking history.
   */
  private async findOrCreateCustomer(tenantId: string, userId: string): Promise<Customer> {
    const existing = await this.prisma.customer.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
    });
    if (existing) return existing;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Sessão inválida.');
    }

    try {
      return await this.prisma.customer.create({
        data: { tenantId, userId, name: user.name, phoneNormalized: user.phoneNormalized, email: user.email },
      });
    } catch (error) {
      if (!this.isUniqueViolation(error)) throw error;
      // Concurrent first request for the same (tenantId, userId) — the other one won the race.
      return this.prisma.customer.findUniqueOrThrow({ where: { tenantId_userId: { tenantId, userId } } });
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
