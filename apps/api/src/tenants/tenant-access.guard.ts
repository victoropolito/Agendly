import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { TenantStatus } from '@prisma/client';

import type { AuthenticatedRequest } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import type { TenantContext } from './tenant-context';

export type TenantRequest = AuthenticatedRequest & { tenantContext?: TenantContext };

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException();
    }

    const memberships = await this.prisma.tenantMember.findMany({
      where: { userId: user.sub, tenantId: user.tenantId, tenant: { status: TenantStatus.ACTIVE } },
      select: { role: true },
    });
    if (memberships.length === 0) {
      throw new ForbiddenException('Você não possui acesso a esta barbearia.');
    }

    request.tenantContext = {
      tenantId: user.tenantId,
      userId: user.sub,
      roles: memberships.map((membership) => membership.role),
    };
    return true;
  }
}
