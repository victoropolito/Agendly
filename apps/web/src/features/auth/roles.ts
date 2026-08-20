import type { TenantRole } from '@/lib/types';

export function isAdminRole(roles: TenantRole[] | undefined): boolean {
  return !!roles?.includes('ADMIN');
}

export function getDefaultRoute(roles: TenantRole[] | undefined): string {
  return isAdminRole(roles) ? '/dashboard' : '/schedule';
}

const ADMIN_ONLY_ROUTES = ['/dashboard', '/settings'];

export function isAdminOnlyRoute(pathname: string): boolean {
  return ADMIN_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
