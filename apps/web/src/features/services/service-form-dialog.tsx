'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { serviceFormSchema, type ServiceFormInput, type ServiceFormValues } from '@/features/services/schemas';
import { useCreateService, useUpdateService } from '@/features/services/use-services';
import type { Service } from '@/lib/types';

interface ServiceFormDialogProps {
  service?: Service;
  trigger: React.ReactNode;
}

export function ServiceFormDialog({ service, trigger }: ServiceFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const createService = useCreateService();
  const updateService = useUpdateService();
  const isEditing = !!service;

  const form = useForm<ServiceFormInput, unknown, ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name ?? '',
      description: service?.description ?? '',
      priceReais: service ? service.priceCents / 100 : 0,
      durationMinutes: service?.durationMinutes ?? 30,
      isActive: service?.isActive ?? true,
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset({
        name: service?.name ?? '',
        description: service?.description ?? '',
        priceReais: service ? service.priceCents / 100 : 0,
        durationMinutes: service?.durationMinutes ?? 30,
        isActive: service?.isActive ?? true,
      });
    }
  }

  async function onSubmit(values: ServiceFormValues) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      priceCents: Math.round(values.priceReais * 100),
      durationMinutes: values.durationMinutes,
      isActive: values.isActive,
    };
    try {
      if (isEditing) {
        await updateService.mutateAsync({ id: service.id, data: payload });
        toast.success('Serviço atualizado.');
      } else {
        await createService.mutateAsync(payload);
        toast.success('Serviço criado.');
      }
      setOpen(false);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  const isSubmitting = createService.isPending || updateService.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar serviço' : 'Novo serviço'}</DialogTitle>
          <DialogDescription>Preço e duração aparecem para o cliente no agendamento.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Corte Masculino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceReais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min)</FormLabel>
                    <FormControl>
                      <Input type="number" step="5" min="5" {...field} value={field.value as number} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <FormLabel>Ativo</FormLabel>
                    <p className="text-xs text-muted-foreground">Serviços inativos somem da página pública.</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando…' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
