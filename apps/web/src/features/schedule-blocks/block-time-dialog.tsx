'use client';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { useProfessionals } from '@/features/professionals/use-professionals';
import { useCreateScheduleBlock } from '@/features/schedule-blocks/use-schedule-blocks';

export function BlockTimeDialog({ trigger, defaultDate }: { trigger: React.ReactNode; defaultDate: string }) {
  const [open, setOpen] = React.useState(false);
  const [professionalId, setProfessionalId] = React.useState('');
  const [date, setDate] = React.useState(defaultDate);
  const [startTime, setStartTime] = React.useState('12:00');
  const [endTime, setEndTime] = React.useState('13:00');
  const [reason, setReason] = React.useState('');
  const { data: professionals } = useProfessionals();
  const createBlock = useCreateScheduleBlock();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setProfessionalId('');
      setDate(defaultDate);
      setStartTime('12:00');
      setEndTime('13:00');
      setReason('');
    }
  }

  async function handleSubmit() {
    if (!professionalId) return;
    try {
      await createBlock.mutateAsync({ professionalId, date, startTime, endTime, reason: reason || undefined });
      toast.success('Horário bloqueado.');
      setOpen(false);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bloquear horário</DialogTitle>
          <DialogDescription>Use para folgas, almoço ou qualquer indisponibilidade pontual.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Profissional</Label>
            <Select value={professionalId} onValueChange={setProfessionalId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {professionals?.map((professional) => (
                  <SelectItem key={professional.id} value={professional.id}>
                    {professional.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="w-40" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1.5">
              <Label>Início</Label>
              <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="w-28" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Término</Label>
              <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="w-28" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Motivo (opcional)</Label>
            <Input placeholder="Almoço, folga…" value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => void handleSubmit()} disabled={!professionalId || createBlock.isPending}>
            {createBlock.isPending ? 'Bloqueando…' : 'Bloquear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
