'use client';

import { CalendarCheck, DollarSign, Scissors, UserCircle, Users } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary } from '@/features/dashboard/use-dashboard';
import { formatAppointmentStatus, formatCents, formatDateShort, formatTime } from '@/lib/format';

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  const stats = [
    { label: 'Agendamentos hoje', value: data?.todayAppointmentsCount, icon: CalendarCheck },
    { label: 'Clientes', value: data?.customersCount, icon: UserCircle },
    { label: 'Profissionais ativos', value: data?.professionalsCount, icon: Users },
    { label: 'Serviços ativos', value: data?.servicesCount, icon: Scissors },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Painel</h1>
        <p className="text-sm text-muted-foreground">Visão geral da sua barbearia.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-full bg-secondary p-2.5">
                <stat.icon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{isLoading ? <Skeleton className="h-7 w-10" /> : stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="rounded-full bg-secondary p-2.5">
            <DollarSign className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-semibold">
              {isLoading || !data ? <Skeleton className="h-7 w-24" /> : formatCents(data.estimatedRevenue.totalCents)}
            </p>
            <p className="text-xs text-muted-foreground">Faturamento estimado no mês</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos agendamentos</CardTitle>
          <CardDescription>Os 5 próximos horários confirmados.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {isLoading && (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          )}
          {!isLoading && data?.upcomingAppointments.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Nenhum agendamento futuro no momento.</p>
          )}
          {data?.upcomingAppointments.map((appointment) => (
            <div
              key={appointment.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{appointment.customer?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.service?.name} com {appointment.professional?.name}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <span className="text-sm font-medium">
                  {formatDateShort(appointment.startsAt)} às {formatTime(appointment.startsAt)}
                </span>
                <Badge variant="secondary">{formatAppointmentStatus(appointment.status)}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Quer criar um agendamento manual?{' '}
        <Link href="/schedule" className="font-medium text-primary underline-offset-4 hover:underline">
          Vá para a agenda
        </Link>
      </p>
    </div>
  );
}
