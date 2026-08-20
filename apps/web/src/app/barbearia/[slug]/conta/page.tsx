'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCustomerAuthErrorMessage, useCustomerAuth } from '@/features/customer-auth/customer-auth-context';
import { CustomerRescheduleDialog } from '@/features/public/customer-reschedule-dialog';
import { useCancelMyAppointment, useMyAppointments } from '@/features/public/use-my-appointments';
import { formatAppointmentStatus, formatCents, formatDateShort, formatTime } from '@/lib/format';

export default function CustomerAccountPage() {
  const { slug, customer, isLoading, isAuthenticated, logout } = useCustomerAuth();
  const router = useRouter();
  const { data: appointments, isLoading: loadingAppointments } = useMyAppointments();
  const cancelAppointment = useCancelMyAppointment();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/barbearia/${slug}/entrar`);
    }
  }, [isLoading, isAuthenticated, router, slug]);

  async function handleCancel(id: string) {
    try {
      await cancelAppointment.mutateAsync(id);
      toast.success('Agendamento cancelado.');
    } catch (error) {
      toast.error(getCustomerAuthErrorMessage(error));
    }
  }

  if (isLoading || !customer) {
    return <Skeleton className="h-40 w-full" />;
  }

  const upcoming = (appointments ?? []).filter((a) => a.status === 'CONFIRMED');
  const history = (appointments ?? []).filter((a) => a.status !== 'CONFIRMED');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Olá, {customer.name.split(' ')[0]}</h1>
          <p className="text-sm text-muted-foreground">Seus agendamentos nesta barbearia.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void logout()}>
          <LogOut className="size-4" /> Sair
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos agendamentos</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {loadingAppointments && <Skeleton className="h-16 w-full" />}
          {!loadingAppointments && upcoming.length === 0 && (
            <p className="text-sm text-muted-foreground">Você não tem agendamentos futuros.</p>
          )}
          {upcoming.map((appointment) => (
            <div key={appointment.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{appointment.service?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDateShort(appointment.startsAt)} às {formatTime(appointment.startsAt)} · {appointment.professional?.name}
                </p>
                <p className="text-sm text-muted-foreground">{formatCents(appointment.priceCentsSnapshot)}</p>
              </div>
              <div className="flex items-center gap-2">
                <CustomerRescheduleDialog appointment={appointment} trigger={<Button variant="outline" size="sm">Reagendar</Button>} />
                <Button variant="ghost" size="sm" onClick={() => void handleCancel(appointment.id)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {history.map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">{appointment.service?.name}</p>
                  <p className="text-sm text-muted-foreground">{formatDateShort(appointment.startsAt)}</p>
                </div>
                <Badge variant="secondary">{formatAppointmentStatus(appointment.status)}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
