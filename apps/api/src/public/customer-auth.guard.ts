import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
    if (tenant.id !== payload.tenantId) {
      throw new NotFoundException('Barbearia não encontrada.');
    }

    const customer = await this.prisma.customer.findFirst({
      where: { tenantId: tenant.id, userId: payload.sub },
    });
    if (!customer) {
      throw new UnauthorizedException('Cliente não encontrado nesta barbearia.');
    }

    request.customerContext = {
      tenantId: tenant.id,
      userId: payload.sub,
      customerId: customer.id,
      customerName: customer.name,
    };
    return true;
  }
}
