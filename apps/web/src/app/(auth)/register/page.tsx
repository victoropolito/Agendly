'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { getAuthErrorMessage, useStaffAuth } from '@/features/auth/staff-auth-context';
import { registerTenantSchema, type RegisterTenantValues } from '@/features/auth/schemas';

const DIACRITICS_PATTERN = new RegExp('[̀-ͯ]', 'g');

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_PATTERN, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function RegisterPage() {
  const { registerTenant } = useStaffAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterTenantValues>({
    resolver: zodResolver(registerTenantSchema),
    defaultValues: { tenantName: '', tenantSlug: '', adminName: '', phone: '', email: '', password: '' },
  });

  async function onSubmit(values: RegisterTenantValues) {
    setIsSubmitting(true);
    try {
      await registerTenant(values);
      toast.success('Barbearia cadastrada com sucesso!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="-ml-2">
            <Link href="/" aria-label="Voltar para o início">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <CardTitle>Cadastrar barbearia</CardTitle>
        </div>
        <CardDescription>Crie sua conta de administrador em poucos passos.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="tenantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da barbearia</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Barbearia Central"
                      maxLength={120}
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        form.setValue('tenantSlug', slugify(event.target.value));
                      }}
                    />
                  </FormControl>
                  <FormDescription>agendly.com/barbearia/{form.watch('tenantSlug') || '...'}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seu nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome completo" maxLength={120} {...field} />
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
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="voce@exemplo.com" autoComplete="email" maxLength={70} {...field} />
                  </FormControl>
                  <FormDescription>Usado para entrar na sua conta.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="mt-2">
              {isSubmitting ? 'Criando…' : 'Criar barbearia'}
            </Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
