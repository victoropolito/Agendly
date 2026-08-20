export function uniqueSuffix(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

export function uniquePhone(): string {
  const suffix = uniqueSuffix().slice(-9).padStart(9, '0');
  return `11${suffix}`;
}

export interface TenantFixture {
  tenantName: string;
  tenantSlug: string;
  adminName: string;
  phone: string;
  email: string;
  password: string;
}

export function buildTenantFixture(): TenantFixture {
  const suffix = uniqueSuffix();
  return {
    tenantName: `Barbearia E2E ${suffix}`,
    tenantSlug: `barbearia-e2e-${suffix}`,
    adminName: 'Admin E2E',
    phone: uniquePhone(),
    email: `admin-e2e-${suffix}@example.com`,
    password: 'senha-segura-123',
  };
}
