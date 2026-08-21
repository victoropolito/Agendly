'use client';

import { LogOut, MapPin, Scissors, Store } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerAuth } from '@/features/customer-auth/customer-auth-context';
import { useBarbershopDirectory, useMyBarbershops } from '@/features/public/use-barbershop-directory';
import type { BarbershopListing } from '@/lib/types';

function BarbershopCard({ barbershop }: { barbershop: BarbershopListing }) {
  return (
    <Link href={`/barbearia/${barbershop.slug}`}>
      <Card className="h-full transition-colors hover:border-primary">
        <CardContent className="flex items-start gap-3 pt-6">
          <Avatar className="size-12">
            <AvatarImage src={barbershop.logoUrl ?? undefined} alt="" />
            <AvatarFallback>
              <Store className="size-5 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate font-medium">{barbershop.name}</p>
            {barbershop.address && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" /> {barbershop.address}
              </p>
            )}
            {barbershop.description && (
              <p className="line-clamp-2 text-xs text-muted-foreground">{barbershop.description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function BarbershopDirectoryPage() {
  const { customer, isAuthenticated, logout } = useCustomerAuth();
  const { data: barbershops, isLoading } = useBarbershopDirectory();
  const { data: myBarbershops } = useMyBarbershops();

  return (
    <div className="flex min-h-screen flex-col bg-secondary/20">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Scissors className="size-5 text-primary" />
            Agendly
          </Link>
          {isAuthenticated && customer && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Olá, {customer.name.split(' ')[0]}</span>
              <Button variant="ghost" size="sm" onClick={() => void logout()}>
                <LogOut className="size-4" /> Sair
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-xl font-semibold">Encontre uma barbearia</h1>
          <p className="text-sm text-muted-foreground">Escolha onde agendar — sua conta funciona em qualquer uma delas.</p>
        </div>

        {isAuthenticated && myBarbershops && myBarbershops.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-medium text-muted-foreground">Suas barbearias</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {myBarbershops.map((barbershop) => (
                <BarbershopCard key={barbershop.id} barbershop={barbershop} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">Todas as barbearias</h2>
          {isLoading && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {!isLoading && barbershops?.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma barbearia disponível no momento.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {barbershops?.map((barbershop) => (
              <BarbershopCard key={barbershop.id} barbershop={barbershop} />
            ))}
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground">Agendly — plataforma de agendamento para barbearias.</footer>
    </div>
  );
}
