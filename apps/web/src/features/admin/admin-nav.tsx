'use client';

import { CalendarDays, LayoutDashboard, Scissors, Settings, UserCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useStaffAuth } from '@/features/auth/staff-auth-context';
import { cn } from '@/lib/utils';

const ADMIN_NAV_ITEMS = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard, adminOnly: true },
  { href: '/schedule', label: 'Agenda', icon: CalendarDays, adminOnly: false },
  { href: '/services', label: 'Serviços', icon: Scissors, adminOnly: false },
  { href: '/professionals', label: 'Profissionais', icon: Users, adminOnly: false },
  { href: '/customers', label: 'Clientes', icon: UserCircle, adminOnly: false },
  { href: '/settings', label: 'Configurações', icon: Settings, adminOnly: true },
];

export function useVisibleNavItems() {
  const { user } = useStaffAuth();
  const isAdmin = !!user?.roles.includes('ADMIN');
  return ADMIN_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const items = useVisibleNavItems();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const items = useVisibleNavItems();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
            )}
          >
            <item.icon className="size-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
