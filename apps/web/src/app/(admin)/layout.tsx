'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminMobileNav, AdminSidebar } from '@/features/admin/admin-nav';
import { useStaffAuth } from '@/features/auth/staff-auth-context';
import { useTenant } from '@/features/tenant/use-tenant';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useStaffAuth();
  const router = useRouter();
  const { data: tenant } = useTenant({ enabled: isAuthenticated });

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 md:flex">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card p-4 md:flex md:flex-col md:gap-6">
        <span className="px-2 text-lg font-semibold tracking-tight">Agendly</span>
        <AdminSidebar />
        <div className="mt-auto flex items-center gap-2 rounded-md border border-border p-2">
          <Avatar>
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{tenant?.name ?? '...'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => void logout()} title="Sair">
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur px-4 py-3 md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{tenant?.name ?? 'Agendly'}</p>
              <p className="text-xs text-muted-foreground">{user.name}</p>
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => void logout()} title="Sair">
              <LogOut className="size-4" />
            </Button>
          </div>
          <div className="mt-3 md:hidden">
            <AdminMobileNav />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
