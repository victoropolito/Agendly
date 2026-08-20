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
import { getCustomerAuthErrorMessage } from '@/features/customer-auth/customer-auth-context';
import { SlotPicker } from '@/features/appointments/slot-picker';
import { useRescheduleMyAppointment } from '@/features/public/use-my-appointments';
import { usePublicAvailability } from '@/features/public/use-public-barbershop';
import { isSlotUnavailableError } from '@/lib/api-error';
import { todayIsoDate } from '@/lib/format';
import type { Appointment } from '@/lib/types';

export function CustomerRescheduleDialog({ appointment, trigger }: { appointment: Appointment; trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(todayIsoDate());
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const queryClient = useQueryClient();
  const reschedule = useRescheduleMyAppointment();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setDate(appointment.startsAt.slice(0, 10));
      setSelectedTime(null);
    }
  }

  const { data: availability, isLoading } = usePublicAvailability({
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
        void queryClient.invalidateQueries({ queryKey: ['public'] });
      }
      toast.error(getCustomerAuthErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reagendar</DialogTitle>
          <DialogDescription>{appointment.service?.name}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Nova data</Label>
            <Input
              type="date"
              min={todayIsoDate()}
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
