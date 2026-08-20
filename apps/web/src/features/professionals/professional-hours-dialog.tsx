'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { useProfessionalHours, useUpdateProfessionalHours } from '@/features/professionals/use-professionals';
import type { ProfessionalHour } from '@/lib/types';
import { WEEKDAY_LABELS } from '@/lib/types';

interface DayRow {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

function buildRows(hours: ProfessionalHour[] | undefined): DayRow[] {
  return WEEKDAY_LABELS.map((_, weekday) => {
    const existing = hours?.find((hour) => hour.weekday === weekday);
    return {
      weekday,
      startTime: existing?.startTime ?? '09:00',
      endTime: existing?.endTime ?? '18:00',
      isActive: existing?.isActive ?? false,
    };
  });
}

export function ProfessionalHoursDialog({ professionalId, professionalName, trigger }: { professionalId: string; professionalName: string; trigger: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const { data: hours, isLoading } = useProfessionalHours(open ? professionalId : undefined);
  const updateHours = useUpdateProfessionalHours();
  const [rows, setRows] = React.useState<DayRow[]>([]);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    // Seeds the editable copy once the async hours query resolves after the dialog opens;
    // there's no synchronous open-time value to seed from (data isn't fetched until open).
    if (open && hours && !initialized) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows(buildRows(hours));
      setInitialized(true);
    }
    if (!open) setInitialized(false);
  }, [open, hours, initialized]);

  function updateRow(weekday: number, patch: Partial<DayRow>) {
    setRows((current) => current.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)));
  }

  async function handleSave() {
    for (const row of rows) {
      if (row.isActive && row.startTime >= row.endTime) {
        toast.error(`${WEEKDAY_LABELS[row.weekday]}: horário de início deve ser antes do término.`);
        return;
      }
    }
    try {
      await updateHours.mutateAsync({ id: professionalId, hours: rows });
      toast.success('Horários atualizados.');
      setOpen(false);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Horários de {professionalName}</DialogTitle>
          <DialogDescription>Dentro do horário de funcionamento da barbearia.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {rows.map((row) => (
            <div key={row.weekday} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex w-32 items-center gap-2">
                <Switch checked={row.isActive} onCheckedChange={(checked) => updateRow(row.weekday, { isActive: checked })} />
                <span className="text-sm font-medium">{WEEKDAY_LABELS[row.weekday]}</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={row.startTime}
                  disabled={!row.isActive}
                  onChange={(event) => updateRow(row.weekday, { startTime: event.target.value })}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">até</span>
                <Input
                  type="time"
                  value={row.endTime}
                  disabled={!row.isActive}
                  onChange={(event) => updateRow(row.weekday, { endTime: event.target.value })}
                  className="w-28"
                />
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => void handleSave()} disabled={updateHours.isPending}>
            {updateHours.isPending ? 'Salvando…' : 'Salvar horários'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
