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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { useAvailability, useCreateAppointment } from '@/features/appointments/use-appointments';
import { SlotPicker } from '@/features/appointments/slot-picker';
import { CustomerFormDialog } from '@/features/customers/customer-form-dialog';
import { useCustomers } from '@/features/customers/use-customers';
import { useProfessionals } from '@/features/professionals/use-professionals';
import { useServices } from '@/features/services/use-services';
import { isSlotUnavailableError } from '@/lib/api-error';
import type { Customer } from '@/lib/types';

interface NewAppointmentDialogProps {
  trigger: React.ReactNode;
  defaultDate: string;
}

export function NewAppointmentDialog({ trigger, defaultDate }: NewAppointmentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [serviceId, setServiceId] = React.useState('');
  const [professionalId, setProfessionalId] = React.useState('');
  const [date, setDate] = React.useState(defaultDate);
  const [selectedSlot, setSelectedSlot] = React.useState<{ professionalId: string; time: string } | null>(null);
  const [notes, setNotes] = React.useState('');

  const queryClient = useQueryClient();
  const { data: services } = useServices();
  const { data: professionals } = useProfessionals();
  const { data: customerResults } = useCustomers(customerSearch);
  const createAppointment = useCreateAppointment();

  const eligibleProfessionals = React.useMemo(
    () => (professionals ?? []).filter((p) => p.isActive && (!serviceId || p.services.some((link) => link.serviceId === serviceId))),
    [professionals, serviceId],
  );

  const { data: availability, isLoading: loadingAvailability } = useAvailability({
    serviceId: serviceId || undefined,
    professionalId: professionalId || undefined,
    date: professionalId && serviceId ? date : undefined,
  });

  function resetForm() {
    setCustomerSearch('');
    setSelectedCustomer(null);
    setServiceId('');
    setProfessionalId('');
    setDate(defaultDate);
    setSelectedSlot(null);
    setNotes('');
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) resetForm();
  }

  async function handleSubmit() {
    if (!selectedCustomer || !serviceId || !professionalId || !selectedSlot) return;
    try {
      await createAppointment.mutateAsync({
        customerId: selectedCustomer.id,
        professionalId,
        serviceId,
        date,
        startTime: selectedSlot.time,
        notes: notes || undefined,
      });
      toast.success('Agendamento criado.');
      setOpen(false);
    } catch (error) {
      if (isSlotUnavailableError(error)) {
        void queryClient.invalidateQueries({ queryKey: ['availability'] });
      }
      toast.error(getAuthErrorMessage(error));
    }
  }

  const canSubmit = !!selectedCustomer && !!serviceId && !!professionalId && !!selectedSlot;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>Criação manual — o backend garante que não há conflito de horário.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Cliente</Label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
                <span>{selectedCustomer.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Buscar cliente pelo nome…"
                  value={customerSearch}
                  onChange={(event) => setCustomerSearch(event.target.value)}
                />
                {customerSearch && (
                  <div className="max-h-32 overflow-y-auto rounded-md border border-border">
                    {(customerResults ?? []).length === 0 && (
                      <p className="p-2 text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                    )}
                    {customerResults?.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        {customer.name}
                      </button>
                    ))}
                  </div>
                )}
                <CustomerFormDialog
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="w-fit">
                      + Novo cliente
                    </Button>
                  }
                  onCreated={(customer) => setSelectedCustomer(customer)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Serviço</Label>
              <Select
                value={serviceId}
                onValueChange={(value) => {
                  setServiceId(value);
                  setProfessionalId('');
                  setSelectedSlot(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {services?.filter((s) => s.isActive).map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Profissional</Label>
              <Select
                value={professionalId}
                onValueChange={(value) => {
                  setProfessionalId(value);
                  setSelectedSlot(null);
                }}
                disabled={!serviceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleProfessionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      {professional.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Data</Label>
            <Input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setSelectedSlot(null);
              }}
              className="w-40"
            />
          </div>

          {serviceId && professionalId && (
            <div className="flex flex-col gap-1.5">
              <Label>Horário</Label>
              <SlotPicker
                availability={availability}
                isLoading={loadingAvailability}
                selected={selectedSlot ?? undefined}
                onSelect={(pid, time) => setSelectedSlot({ professionalId: pid, time })}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Observações (opcional)</Label>
            <Textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit || createAppointment.isPending}>
            {createAppointment.isPending ? 'Agendando…' : 'Confirmar agendamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
