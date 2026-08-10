import type { TenantRole } from '@prisma/client';

export interface TenantContext {
  tenantId: string;
  userId: string;
  roles: TenantRole[];
}
