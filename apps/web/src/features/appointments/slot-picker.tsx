'use client';

import { cn } from '@/lib/utils';
import type { AvailabilityResult } from '@/lib/types';

interface SlotPickerProps {
  availability: AvailabilityResult | undefined;
  isLoading: boolean;
  selected?: { professionalId: string; time: string };
  onSelect: (professionalId: string, time: string) => void;
}

export function SlotPicker({ availability, isLoading, selected, onSelect }: SlotPickerProps) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando horários…</p>;
  }
  if (!availability) {
    return <p className="text-sm text-muted-foreground">Escolha o serviço e a data para ver os horários.</p>;
  }

  const hasAnySlot = availability.professionals.some((professional) => professional.slots.length > 0);
  console.log(availability.professionals)
  return (
    <div className="flex flex-col gap-4">
      {!hasAnySlot && (
        <p className="text-sm text-muted-foreground">Nenhum horário disponível para esta data.</p>
      )}
      {availability.professionals.map(
        (professional) =>
          professional.slots.length > 0 && (
            <div key={professional.professionalId} className="flex flex-col gap-2">
              {availability.professionals.length > 1 && <p className="text-sm font-medium">{professional.name}</p>}
              <div className="flex flex-wrap gap-2">
                {professional.slots.map((time) => {
                  const isSelected = selected?.professionalId === professional.professionalId && selected.time === time;
                  return (
                    <button
                      key={`${professional.professionalId}-${time}`}
                      type="button"
                      onClick={() => onSelect(professional.professionalId, time)}
                      className={cn(
                        'rounded-md border border-input px-3 py-1.5 text-sm font-medium transition-colors',
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-secondary',
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          ),
      )}

      {availability.alternatives && availability.alternatives.length > 0 && (
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-border p-3">
          <p className="text-sm text-muted-foreground">
            O profissional selecionado não tem horários. Encontramos disponibilidade com:
          </p>
          {availability.alternatives.map((professional) => (
            <div key={professional.professionalId} className="flex flex-col gap-2">
              <p className="text-sm font-medium">{professional.name}</p>
              <div className="flex flex-wrap gap-2">
                {professional.slots.map((time) => {
                  const isSelected = selected?.professionalId === professional.professionalId && selected.time === time;
                  return (
                    <button
                      key={`${professional.professionalId}-${time}`}
                      type="button"
                      onClick={() => onSelect(professional.professionalId, time)}
                      className={cn(
                        'rounded-md border border-input px-3 py-1.5 text-sm font-medium transition-colors',
                        isSelected ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-secondary',
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
