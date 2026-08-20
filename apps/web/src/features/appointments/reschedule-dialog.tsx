'use client';

import { useQueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { useAvailability, useRescheduleAppointment } from '@/features/appointments/use-appointments';
import { SlotPicker } from '@/features/appointments/slot-picker';
import { isSlotUnavailableError } from '@/lib/api-error';
import type { Appointment } from '@/lib/types';
import { todayIsoDate } from '@/lib/format';

export function RescheduleDialog({ appointment, trigger }: { appointment: Appointment; trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(todayIsoDate());
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const reschedule = useRescheduleAppointment();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDate(appointment.startsAt.slice(0, 10));
      setSelectedTime(null);
    }
  }

  const { data: availability, isLoading } = useAvailability({
    serviceId: appointment.serviceId,
    professionalId: appointment.professionalId,
    date,
  });

  async function handleSubmit() {
    if (!selectedTime) return;
    try {
      await reschedule.mutateAsync({ id: appointment.id, data: { date, startTime: selectedTime } });
      toast.success('Agendamento reagendado.');
      setOpen(false);
    } catch (error) {
      if (isSlotUnavailableError(error)) {
        void queryClient.invalidateQueries({ queryKey: ['availability'] });
      }
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reagendar</DialogTitle>
          <DialogDescription>{appointment.customer?.name} — {appointment.service?.name}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nova data</Label>
            <Input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSelectedTime(null);
              }}
              className="w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Horário</Label>
            <SlotPicker
              availability={availability}
              isLoading={isLoading}
              selected={selectedTime ? { professionalId: appointment.professionalId, time: selectedTime } : undefined}
              onSelect={(_pid, time) => setSelectedTime(time)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => void handleSubmit()} disabled={!selectedTime || reschedule.isPending}>
            {reschedule.isPending ? 'Salvando…' : 'Confirmar novo horário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
