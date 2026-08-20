'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCustomerAuthErrorMessage, useCustomerAuth } from '@/features/customer-auth/customer-auth-context';
import {
  customerLoginSchema,
  customerRegisterSchema,
  type CustomerLoginValues,
  type CustomerRegisterValues,
} from '@/features/customer-auth/schemas';
import { SlotPicker } from '@/features/appointments/slot-picker';
import { useBookAppointment } from '@/features/public/use-my-appointments';
import { usePublicAvailability, usePublicProfessionals, usePublicServices } from '@/features/public/use-public-barbershop';
import { isSlotUnavailableError } from '@/lib/api-error';
import { formatCents, formatDateLong, formatDurationMinutes, todayIsoDate } from '@/lib/format';
import type { PublicProfessional, PublicService } from '@/lib/types';

type Step = 'service' | 'professional' | 'date' | 'time' | 'auth' | 'confirm';

function StepHeader({ title, onBack }: { title: string; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="size-4" />
        </Button>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

export function BookingFlow() {
  const router = useRouter();
  const { slug, isAuthenticated, login, register } = useCustomerAuth();
  const { data: services, isLoading: loadingServices } = usePublicServices();
  const { data: professionals } = usePublicProfessionals();
  const bookAppointment = useBookAppointment();

  const [step, setStep] = React.useState<Step>('service');
  const [service, setService] = React.useState<PublicService | null>(null);
  const [professional, setProfessional] = React.useState<PublicProfessional | 'any' | null>(null);
  const [date, setDate] = React.useState(todayIsoDate());
  const [selectedSlot, setSelectedSlot] = React.useState<{ professionalId: string; time: string } | null>(null);
  const [authTab, setAuthTab] = React.useState<'login' | 'register'>('register');

  const { data: availability, isLoading: loadingAvailability } = usePublicAvailability({
    serviceId: service?.id,
    professionalId: professional && professional !== 'any' ? professional.id : undefined,
    date: step === 'time' ? date : undefined,
  });

  const eligibleProfessionals = React.useMemo(
    () => (professionals ?? []).filter((p) => !service || p.services.some((link) => link.serviceId === service.id)),
    [professionals, service],
  );

  const registerForm = useForm<CustomerRegisterValues>({
    resolver: zodResolver(customerRegisterSchema),
    defaultValues: { name: '', phone: '', email: '', password: '' },
  });
  const loginForm = useForm<CustomerLoginValues>({
    resolver: zodResolver(customerLoginSchema),
    defaultValues: { identifier: '', password: '' },
  });
  const [authSubmitting, setAuthSubmitting] = React.useState(false);

  async function handleRegister(values: CustomerRegisterValues) {
    setAuthSubmitting(true);
    try {
      await register({ ...values, phone: values.phone || undefined, email: values.email || undefined });
      setStep('confirm');
    } catch (error) {
      toast.error(getCustomerAuthErrorMessage(error));
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogin(values: CustomerLoginValues) {
    setAuthSubmitting(true);
    try {
      await login(values);
      setStep('confirm');
    } catch (error) {
      toast.error(getCustomerAuthErrorMessage(error));
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleConfirm() {
    if (!service || !selectedSlot) return;
    try {
      await bookAppointment.mutateAsync({
        serviceId: service.id,
        professionalId: selectedSlot.professionalId,
        date,
        startTime: selectedSlot.time,
      });
      toast.success('Agendamento confirmado!');
      router.push(`/barbearia/${slug}/conta`);
    } catch (error) {
      if (isSlotUnavailableError(error)) {
        setStep('time');
      }
      toast.error(getCustomerAuthErrorMessage(error));
    }
  }

  if (step === 'service') {
    return (
      <Card>
        <CardHeader>
          <StepHeader title="Escolha o serviço" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {loadingServices && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {services?.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setService(item);
                setStep('professional');
              }}
              className="flex items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:border-primary"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">{formatDurationMinutes(item.durationMinutes)}</p>
              </div>
              <span className="font-medium">{formatCents(item.priceCents)}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (step === 'professional') {
    return (
      <Card>
        <CardHeader>
          <StepHeader title="Escolha o profissional" onBack={() => setStep('service')} />
          <CardDescription>{service?.name}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setProfessional('any');
              setStep('date');
            }}
            className="rounded-lg border border-border p-3 text-left font-medium transition-colors hover:border-primary"
          >
            Qualquer profissional disponível
          </button>
          {eligibleProfessionals.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setProfessional(item);
                setStep('date');
              }}
              className="rounded-lg border border-border p-3 text-left font-medium transition-colors hover:border-primary"
            >
              {item.name}
            </button>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (step === 'date') {
    return (
      <Card>
        <CardHeader>
          <StepHeader title="Escolha a data" onBack={() => setStep('professional')} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Input
            type="date"
            min={todayIsoDate()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-48"
          />
          <Button onClick={() => setStep('time')} className="w-fit">
            Ver horários
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 'time') {
    return (
      <Card>
        <CardHeader>
          <StepHeader title="Escolha o horário" onBack={() => setStep('date')} />
          <CardDescription>{formatDateLong(date)}</CardDescription>
        </CardHeader>
        <CardContent>
          <SlotPicker
            availability={availability}
            isLoading={loadingAvailability}
            selected={selectedSlot ?? undefined}
            onSelect={(professionalId, time) => {
              setSelectedSlot({ professionalId, time });
              setStep(isAuthenticated ? 'confirm' : 'auth');
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (step === 'auth') {
    return (
      <Card>
        <CardHeader>
          <StepHeader title="Só mais um passo" onBack={() => setStep('time')} />
          <CardDescription>Entre ou crie sua conta para confirmar o agendamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={authTab} onValueChange={(value) => setAuthTab(value as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="register">Sou novo aqui</TabsTrigger>
              <TabsTrigger value="login">Já tenho conta</TabsTrigger>
            </TabsList>
            <TabsContent value="register">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="flex flex-col gap-4">
                  <FormField
                    control={registerForm.control}
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
                  <p className="text-xs text-muted-foreground">Informe pelo menos um: WhatsApp ou e-mail.</p>
                  <FormField
                    control={registerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <PhoneInput placeholder="(99) 99999-9999" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="voce@exemplo.com" maxLength={70} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crie uma senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={authSubmitting}>
                    {authSubmitting ? 'Criando conta…' : 'Continuar'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="flex flex-col gap-4">
                  <FormField
                    control={loginForm.control}
                    name="identifier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail ou WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="voce@exemplo.com ou (11) 99999-0000" maxLength={255} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={authSubmitting}>
                    {authSubmitting ? 'Entrando…' : 'Continuar'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // step === 'confirm'
  return (
    <Card>
      <CardHeader>
        <StepHeader title="Confirmar agendamento" onBack={() => setStep('time')} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg border border-border p-4">
          <p className="font-medium">{service?.name}</p>
          <p className="text-sm text-muted-foreground">{formatDateLong(date)} às {selectedSlot?.time}</p>
          {service && <p className="text-sm text-muted-foreground">{formatCents(service.priceCents)} · {formatDurationMinutes(service.durationMinutes)}</p>}
        </div>
        <Button onClick={() => void handleConfirm()} disabled={bookAppointment.isPending} size="lg">
          <Check /> {bookAppointment.isPending ? 'Confirmando…' : 'Confirmar agendamento'}
        </Button>
      </CardContent>
    </Card>
  );
}
