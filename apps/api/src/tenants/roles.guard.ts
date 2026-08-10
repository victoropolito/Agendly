import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { TenantRole } from '@prisma/client';

import type { TenantRequest } from './tenant-access.guard';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<TenantRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    if (!request.tenantContext?.roles.some((role) => requiredRoles.includes(role))) {
      throw new ForbiddenException('Você não possui permissão para esta ação.');
    }
    return true;
  }
}
