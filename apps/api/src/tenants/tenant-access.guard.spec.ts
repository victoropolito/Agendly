import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { TenantRole } from '@prisma/client';

import { TenantAccessGuard } from './tenant-access.guard';

describe('TenantAccessGuard', () => {
  const request = { user: { sub: 'user-a', tenantId: 'tenant-a', sid: 'session-a', roles: [TenantRole.ADMIN] } };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  it('uses current database membership instead of trusting token roles', async () => {
    const prisma = {
      tenantMember: { findMany: jest.fn().mockResolvedValue([{ role: TenantRole.PROFESSIONAL }]) },
    };
    const guard = new TenantAccessGuard(prisma as never);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request).toMatchObject({ tenantContext: { tenantId: 'tenant-a', userId: 'user-a', roles: [TenantRole.PROFESSIONAL] } });
  });

  it('rejects a token whose user no longer belongs to the tenant', async () => {
    const prisma = { tenantMember: { findMany: jest.fn().mockResolvedValue([]) } };
    const guard = new TenantAccessGuard(prisma as never);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
