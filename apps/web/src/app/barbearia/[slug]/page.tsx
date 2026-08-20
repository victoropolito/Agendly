'use client';

import { MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomerAuth } from '@/features/customer-auth/customer-auth-context';
import { usePublicProfessionals, usePublicServices, usePublicTenant } from '@/features/public/use-public-barbershop';
import { formatCents, formatDurationMinutes, formatPhoneDisplay } from '@/lib/format';

export default function BarbershopPublicPage() {
  const { slug } = useCustomerAuth();
  const { data: tenant, isLoading: loadingTenant } = usePublicTenant();
  const { data: services } = usePublicServices();
  const { data: professionals } = usePublicProfessionals();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          {loadingTenant && <Skeleton className="h-8 w-48" />}
          {tenant && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">{tenant.name}</h1>
              {tenant.description && <p className="text-sm text-muted-foreground">{tenant.description}</p>}
              <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                {tenant.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {tenant.address}
                  </span>
                )}
                {tenant.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5" /> {formatPhoneDisplay(tenant.phone)}
                  </span>
                )}
              </div>
            </>
          )}
          <Button asChild size="lg" className="mt-2 w-fit">
            <Link href={`/barbearia/${slug}/agendar`}>Agendar horário</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Serviços</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!services && <Skeleton className="h-20 w-full" />}
          {services?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum serviço disponível no momento.</p>}
          {services?.map((service) => (
            <div key={service.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="font-medium">{service.name}</p>
                {service.description && <p className="text-sm text-muted-foreground">{service.description}</p>}
              </div>
              <div className="text-right">
                <p className="font-medium">{formatCents(service.priceCents)}</p>
                <p className="text-xs text-muted-foreground">{formatDurationMinutes(service.durationMinutes)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profissionais</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {!professionals && <Skeleton className="h-8 w-32" />}
          {professionals?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum profissional disponível.</p>}
          {professionals?.map((professional) => (
            <Badge key={professional.id} variant="secondary" className="px-3 py-1.5 text-sm">
              {professional.name}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
