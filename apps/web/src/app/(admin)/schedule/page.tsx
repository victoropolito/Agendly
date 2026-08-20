'use client';

import { ChevronLeft, ChevronRight, Lock, Plus, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { NewAppointmentDialog } from '@/features/appointments/new-appointment-dialog';
import { RescheduleDialog } from '@/features/appointments/reschedule-dialog';
import { useAppointments, useCancelAppointment } from '@/features/appointments/use-appointments';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { useProfessionals } from '@/features/professionals/use-professionals';
import { BlockTimeDialog } from '@/features/schedule-blocks/block-time-dialog';
import { useDeleteScheduleBlock, useScheduleBlocks } from '@/features/schedule-blocks/use-schedule-blocks';
import { formatCents, formatTime, todayIsoDate } from '@/lib/format';
import type { Appointment, ScheduleBlock } from '@/lib/types';

type TimelineEntry = { kind: 'appointment'; startsAt: string; data: Appointment } | { kind: 'block'; startsAt: string; data: ScheduleBlock };

function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export default function SchedulePage() {
  const [date, setDate] = React.useState(todayIsoDate());
  const [professionalId, setProfessionalId] = React.useState('all');

  const { data: professionals } = useProfessionals();
  const { data: appointments, isLoading: loadingAppointments } = useAppointments({
    date,
    professionalId: professionalId === 'all' ? undefined : professionalId,
  });
  const { data: blocks, isLoading: loadingBlocks } = useScheduleBlocks({
    date,
    professionalId: professionalId === 'all' ? undefined : professionalId,
  });
  const cancelAppointment = useCancelAppointment();
  const deleteBlock = useDeleteScheduleBlock();

  const timeline: TimelineEntry[] = React.useMemo(() => {
    const items: TimelineEntry[] = [];
    for (const appointment of appointments ?? []) {
      if (appointment.status !== 'CANCELLED') items.push({ kind: 'appointment', startsAt: appointment.startsAt, data: appointment });
    }
    for (const block of blocks ?? []) {
      items.push({ kind: 'block', startsAt: block.startsAt, data: block });
    }
    return items.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [appointments, blocks]);

  async function handleCancel(id: string) {
    try {
      await cancelAppointment.mutateAsync(id);
      toast.success('Agendamento cancelado.');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  async function handleRemoveBlock(id: string) {
    try {
      await deleteBlock.mutateAsync(id);
      toast.success('Bloqueio removido.');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  const isLoading = loadingAppointments || loadingBlocks;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="text-sm text-muted-foreground">Agendamentos e bloqueios do dia.</p>
        </div>
        <div className="flex gap-2">
          <BlockTimeDialog
            defaultDate={date}
            trigger={
              <Button variant="outline">
                <Lock /> Bloquear horário
              </Button>
            }
          />
          <NewAppointmentDialog
            defaultDate={date}
            trigger={
              <Button>
                <Plus /> Novo agendamento
              </Button>
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => setDate((d) => shiftDate(d, -1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-40" />
          <Button variant="outline" size="icon" onClick={() => setDate((d) => shiftDate(d, 1))}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDate(todayIsoDate())}>
            Hoje
          </Button>
        </div>
        <Select value={professionalId} onValueChange={setProfessionalId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os profissionais</SelectItem>
            {professionals?.map((professional) => (
              <SelectItem key={professional.id} value={professional.id}>
                {professional.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && timeline.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Nenhum agendamento ou bloqueio neste dia.
        </div>
      )}

      <div className="flex flex-col gap-2">
        {timeline.map((entry) => {
          if (entry.kind === 'block') {
            const block = entry.data;
            return (
              <div key={`block-${block.id}`} className="flex items-center justify-between rounded-lg border border-dashed border-border bg-secondary/40 p-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {formatTime(block.startsAt)} – {formatTime(block.endsAt)} · Bloqueado
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {block.professional?.name} {block.reason ? `· ${block.reason}` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => void handleRemoveBlock(block.id)} title="Remover bloqueio">
                  <X className="size-4" />
                </Button>
              </div>
            );
          }

          const appointment = entry.data;
          return (
            <div key={appointment.id} className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">
                  {formatTime(appointment.startsAt)} · {appointment.customer?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {appointment.service?.name} com {appointment.professional?.name} · {formatCents(appointment.priceCentsSnapshot)}
                </p>
                {appointment.notes && <p className="text-xs text-muted-foreground">{appointment.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                {appointment.status === 'CONFIRMED' ? (
                  <>
                    <RescheduleDialog appointment={appointment} trigger={<Button variant="outline" size="sm">Reagendar</Button>} />
                    <Button variant="ghost" size="sm" onClick={() => void handleCancel(appointment.id)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Badge variant="secondary">
                    {appointment.status === 'COMPLETED' ? 'Concluído' : appointment.status === 'NO_SHOW' ? 'Não compareceu' : appointment.status}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
