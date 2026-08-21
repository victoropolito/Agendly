'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { UserRound } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { PhoneInput } from '@/components/ui/phone-input';
import { Switch } from '@/components/ui/switch';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { professionalFormSchema, type ProfessionalFormValues } from '@/features/professionals/schemas';
import { useCreateProfessional, useUpdateProfessional } from '@/features/professionals/use-professionals';
import { useServices } from '@/features/services/use-services';
import { ImageUploadField } from '@/features/uploads/image-upload-field';
import type { Professional } from '@/lib/types';

interface ProfessionalFormDialogProps {
  professional?: Professional;
  trigger: React.ReactNode;
}

export function ProfessionalFormDialog({ professional, trigger }: ProfessionalFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(professional?.photoUrl ?? null);
  const { data: services } = useServices();
  const createProfessional = useCreateProfessional();
  const updateProfessional = useUpdateProfessional();
  const isEditing = !!professional;

  const defaults: ProfessionalFormValues = {
    name: professional?.name ?? '',
    phone: professional?.phone ?? '',
    isActive: professional?.isActive ?? true,
    serviceIds: professional?.services.map((link) => link.serviceId) ?? [],
  };

  const form = useForm<ProfessionalFormValues>({ resolver: zodResolver(professionalFormSchema), defaultValues: defaults });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset(defaults);
      setPhotoUrl(professional?.photoUrl ?? null);
    }
  }

  async function onSubmit(values: ProfessionalFormValues) {
    const payload = { ...values, phone: values.phone || undefined, photoUrl: photoUrl ?? undefined };
    try {
      if (isEditing) {
        await updateProfessional.mutateAsync({ id: professional.id, data: payload });
        toast.success('Profissional atualizado.');
      } else {
        await createProfessional.mutateAsync(payload);
        toast.success('Profissional cadastrado.');
      }
      setOpen(false);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  const isSubmitting = createProfessional.isPending || updateProfessional.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar profissional' : 'Novo profissional'}</DialogTitle>
          <DialogDescription>Escolha quais serviços este profissional executa.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <ImageUploadField
              label="Foto"
              value={photoUrl}
              onChange={setPhotoUrl}
              fallback={<UserRound className="size-6 text-muted-foreground" />}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" maxLength={120} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (opcional)</FormLabel>
                  <FormControl>
                    <PhoneInput placeholder="(11) 99999-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceIds"
              render={() => (
                <FormItem>
                  <FormLabel>Serviços que executa</FormLabel>
                  <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
                    {(!services || services.length === 0) && (
                      <p className="text-xs text-muted-foreground">Cadastre serviços primeiro.</p>
                    )}
                    {services?.map((service) => (
                      <label key={service.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.watch('serviceIds').includes(service.id)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues('serviceIds');
                            form.setValue(
                              'serviceIds',
                              checked ? [...current, service.id] : current.filter((id) => id !== service.id),
                            );
                          }}
                        />
                        {service.name}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3">
                  <FormLabel>Ativo</FormLabel>
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
