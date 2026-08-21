'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Store } from 'lucide-react';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Textarea } from '@/components/ui/textarea';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { BusinessHoursEditor } from '@/features/tenant/business-hours-editor';
import { PublicLinkCard } from '@/features/tenant/public-link-card';
import { tenantSettingsSchema, type TenantSettingsValues } from '@/features/tenant/schemas';
import { useTenant, useUpdateTenant } from '@/features/tenant/use-tenant';
import { WhatsAppConnectionCard } from '@/features/tenant/whatsapp-connection-card';
import { ImageUploadField } from '@/features/uploads/image-upload-field';

export default function SettingsPage() {
  const { data: tenant, isLoading } = useTenant();
  const updateTenant = useUpdateTenant();

  const form = useForm<TenantSettingsValues>({
    resolver: zodResolver(tenantSettingsSchema),
    values: tenant
      ? {
          name: tenant.name,
          phone: tenant.phone ?? '',
          email: tenant.email ?? '',
          description: tenant.description ?? '',
          address: tenant.address ?? '',
          timezone: tenant.timezone,
        }
      : undefined,
  });

  async function onSubmit(values: TenantSettingsValues) {
    try {
      await updateTenant.mutateAsync({
        ...values,
        phone: values.phone || undefined,
        email: values.email || undefined,
      });
      toast.success('Dados da barbearia atualizados.');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  async function handleLogoChange(logoUrl: string) {
    try {
      await updateTenant.mutateAsync({ logoUrl });
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Dados públicos e horário de funcionamento da barbearia.</p>
      </div>

      {tenant && <PublicLinkCard slug={tenant.slug} />}

      <Card>
        <CardHeader>
          <CardTitle>Dados da barbearia</CardTitle>
          <CardDescription>Essas informações aparecem na sua página pública.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {tenant && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <ImageUploadField
                  label="Logo"
                  value={tenant.logoUrl}
                  onChange={(url) => void handleLogoChange(url)}
                  fallback={<Store className="size-6 text-muted-foreground" />}
                />
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp / Telefone</FormLabel>
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
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" disabled maxLength={70} {...field} />
                        </FormControl>
                        <FormDescription>Usado para entrar na conta — não pode ser alterado por aqui ainda.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Conte um pouco sobre a barbearia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={updateTenant.isPending} className="w-fit">
                  {updateTenant.isPending ? 'Salvando…' : 'Salvar dados'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <BusinessHoursEditor />

      <WhatsAppConnectionCard />
    </div>
  );
}
