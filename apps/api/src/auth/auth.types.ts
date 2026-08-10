import { TenantRole } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  tenantId: string;
  roles: TenantRole[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
