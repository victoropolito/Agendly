'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useBusinessHours, useUpdateBusinessHours } from '@/features/tenant/use-tenant';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import type { BusinessHour } from '@/lib/types';
import { WEEKDAY_LABELS } from '@/lib/types';

interface DayRow {
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

function buildRows(hours: BusinessHour[] | undefined): DayRow[] {
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

export function BusinessHoursEditor() {
  const { data: hours, isLoading } = useBusinessHours();
  const updateHours = useUpdateBusinessHours();
  const [rows, setRows] = React.useState<DayRow[]>([]);
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    // Seeds the editable copy once the business hours query resolves; there's no
    // synchronous value to seed from before the initial fetch completes.
    if (!initialized && hours) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRows(buildRows(hours));
      setInitialized(true);
    }
  }, [hours, initialized]);

  function updateRow(weekday: number, patch: Partial<DayRow>) {
    setRows((current) => current.map((row) => (row.weekday === weekday ? { ...row, ...patch } : row)));
  }

  async function handleSave() {
    for (const row of rows) {
      if (row.isActive && row.startTime >= row.endTime) {
        toast.error(`${WEEKDAY_LABELS[row.weekday]}: o horário de início deve ser antes do término.`);
        return;
      }
    }
    try {
      await updateHours.mutateAsync(rows);
      toast.success('Horários de funcionamento atualizados.');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horário de funcionamento</CardTitle>
        <CardDescription>Defina em quais dias e horários sua barbearia atende.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {rows.map((row) => (
          <div key={row.weekday} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex w-36 items-center gap-2">
              <Switch checked={row.isActive} onCheckedChange={(checked) => updateRow(row.weekday, { isActive: checked })} />
              <span className="text-sm font-medium">{WEEKDAY_LABELS[row.weekday]}</span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={row.startTime}
                disabled={!row.isActive}
                onChange={(event) => updateRow(row.weekday, { startTime: event.target.value })}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">até</span>
              <Input
                type="time"
                value={row.endTime}
                disabled={!row.isActive}
                onChange={(event) => updateRow(row.weekday, { endTime: event.target.value })}
                className="w-32"
              />
            </div>
          </div>
        ))}
        <Button onClick={() => void handleSave()} disabled={updateHours.isPending} className="mt-2 w-fit">
          {updateHours.isPending ? 'Salvando…' : 'Salvar horários'}
        </Button>
      </CardContent>
    </Card>
  );
}
