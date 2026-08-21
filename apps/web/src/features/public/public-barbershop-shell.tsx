'use client';

import { Scissors, UserCircle } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { useCustomerAuth } from '@/features/customer-auth/customer-auth-context';

function BarbershopHeader({ slug }: { slug: string }) {
  const { isAuthenticated, isLoading } = useCustomerAuth();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href={`/barbearia/${slug}`} className="flex items-center gap-2 font-semibold tracking-tight">
          <Scissors className="size-5 text-primary" />
          Agendly
        </Link>
        {!isLoading && (
          <nav>
            {isAuthenticated ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/barbearia/${slug}/conta`}>
                  <UserCircle /> Minha conta
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link href={`/barbearia/${slug}/entrar`}>Entrar</Link>
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

export function PublicBarbershopShell({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-secondary/20">
      <BarbershopHeader slug={slug} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      <footer className="py-6 text-center text-xs text-muted-foreground">Agendado com Agendly</footer>
    </div>
  );
}
