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
import { PhoneInput } from '@/components/ui/phone-input';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { customerFormSchema, type CustomerFormValues } from '@/features/customers/schemas';
import { useCreateCustomer } from '@/features/customers/use-customers';
import type { Customer } from '@/lib/types';

interface CustomerFormDialogProps {
  trigger: React.ReactNode;
  onCreated?: (customer: Customer) => void;
}

export function CustomerFormDialog({ trigger, onCreated }: CustomerFormDialogProps) {
  const [open, setOpen] = React.useState(false);
  const createCustomer = useCreateCustomer();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { name: '', phone: '', email: '' },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) form.reset({ name: '', phone: '', email: '' });
  }

  async function onSubmit(values: CustomerFormValues) {
    try {
      const customer = await createCustomer.mutateAsync({ ...values, email: values.email || undefined });
      toast.success('Cliente cadastrado.');
      setOpen(false);
      onCreated?.(customer);
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo cliente</DialogTitle>
          <DialogDescription>Cadastro rápido para agendamento manual ou walk-in.</DialogDescription>
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
                    <Input maxLength={120} {...field} />
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
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <PhoneInput placeholder="(11) 99999-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail (opcional)</FormLabel>
                  <FormControl>
                    <Input type="email" maxLength={70} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? 'Salvando…' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
