'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import {
  useConnectWhatsApp,
  useDisconnectWhatsApp,
  useStartEvolutionConnection,
  useWhatsAppConnection,
} from '@/features/tenant/use-tenant';
import type { WhatsAppConnection } from '@/lib/types';

const metaSchema = z.object({
  phoneNumberId: z.string().min(1, 'Informe o Phone Number ID.'),
  businessAccountId: z.string().min(1, 'Informe o Business Account ID.'),
  accessToken: z.string().min(1, 'Informe o token de acesso.'),
});
type MetaValues = z.infer<typeof metaSchema>;

const twilioSchema = z.object({
  accountSid: z.string().min(1, 'Informe o Account SID.'),
  authToken: z.string().min(1, 'Informe o Auth Token.'),
  fromNumber: z.string().min(1, 'Informe o número de WhatsApp remetente.'),
});
type TwilioValues = z.infer<typeof twilioSchema>;

const PROVIDER_LABELS: Record<string, string> = {
  META_CLOUD_API: 'Meta Cloud API',
  TWILIO: 'Twilio',
  EVOLUTION_API: 'Evolution API (QR Code)',
};

function EvolutionConnectForm({ connection }: { connection?: WhatsAppConnection }) {
  const startConnection = useStartEvolutionConnection();
  const [qrCode, setQrCode] = React.useState<string | null>(null);

  async function handleGenerateQr() {
    setQrCode(null);
    try {
      const result = await startConnection.mutateAsync();
      if (result.qrCodeBase64) {
        setQrCode(result.qrCodeBase64);
      } else {
        toast.success('WhatsApp já está conectado.');
      }
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  const isConnecting = connection?.status === 'CONNECTING';

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Conecta seu WhatsApp pessoal via QR Code, igual ao WhatsApp Web — sem cadastro de empresa. Requer o servidor
        Evolution API rodando (já incluso no <code>docker-compose.yml</code> deste projeto).
      </p>
      {qrCode && isConnecting && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI from our own API, not an optimizable remote asset */}
          <img src={qrCode} alt="QR Code para conectar o WhatsApp" className="size-56" />
          <p className="text-center text-sm text-muted-foreground">
            Abra o WhatsApp no celular → Configurações → Aparelhos conectados → Conectar um aparelho, e escaneie o
            código acima.
          </p>
          <p className="text-xs text-muted-foreground">Aguardando leitura do QR Code…</p>
        </div>
      )}
      <Button
        type="button"
        onClick={() => void handleGenerateQr()}
        disabled={startConnection.isPending}
        className="w-fit"
      >
        {startConnection.isPending ? 'Gerando…' : qrCode ? 'Gerar novo QR Code' : 'Gerar QR Code'}
      </Button>
    </div>
  );
}

function MetaConnectForm() {
  const connectWhatsApp = useConnectWhatsApp();
  const form = useForm<MetaValues>({
    resolver: zodResolver(metaSchema),
    defaultValues: { phoneNumberId: '', businessAccountId: '', accessToken: '' },
  });

  async function onSubmit(values: MetaValues) {
    try {
      await connectWhatsApp.mutateAsync({ provider: 'META_CLOUD_API', ...values });
      toast.success('WhatsApp conectado com sucesso.');
      form.reset({ phoneNumberId: '', businessAccountId: '', accessToken: '' });
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Encontre esses dados no painel do WhatsApp Business Platform (Meta for Developers), no seu app conectado ao
          número de negócio. Requer verificação de empresa para uso em produção.
        </p>
        <FormField
          control={form.control}
          name="phoneNumberId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number ID</FormLabel>
              <FormControl>
                <Input placeholder="123456789012345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="businessAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business Account ID</FormLabel>
              <FormControl>
                <Input placeholder="123456789012345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="accessToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Token de acesso</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="off" placeholder="EAAG..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={connectWhatsApp.isPending} className="w-fit">
          {connectWhatsApp.isPending ? 'Conectando…' : 'Conectar Meta Cloud API'}
        </Button>
      </form>
    </Form>
  );
}

function TwilioConnectForm() {
  const connectWhatsApp = useConnectWhatsApp();
  const form = useForm<TwilioValues>({
    resolver: zodResolver(twilioSchema),
    defaultValues: { accountSid: '', authToken: '', fromNumber: '+14155238886' },
  });

  async function onSubmit(values: TwilioValues) {
    try {
      await connectWhatsApp.mutateAsync({ provider: 'TWILIO', ...values });
      toast.success('WhatsApp (Twilio) conectado com sucesso.');
      form.reset({ accountSid: '', authToken: '', fromNumber: '+14155238886' });
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Modo sandbox do Twilio: sem verificação de empresa, ótimo para testar. Pegue o Account SID e Auth Token em
          console.twilio.com. Antes de agendar, cada número que deve receber mensagens precisa mandar &quot;join
          &lt;código&gt;&quot; para o número de sandbox pelo próprio WhatsApp.
        </p>
        <FormField
          control={form.control}
          name="accountSid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account SID</FormLabel>
              <FormControl>
                <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="authToken"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Auth Token</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fromNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número de WhatsApp remetente</FormLabel>
              <FormControl>
                <Input placeholder="+14155238886" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={connectWhatsApp.isPending} className="w-fit">
          {connectWhatsApp.isPending ? 'Conectando…' : 'Conectar Twilio Sandbox'}
        </Button>
      </form>
    </Form>
  );
}

export function WhatsAppConnectionCard() {
  const { data: connection, isLoading } = useWhatsAppConnection();
  const disconnectWhatsApp = useDisconnectWhatsApp();
  const isConnected = connection?.status === 'CONNECTED';
  const isConnecting = connection?.status === 'CONNECTING';

  async function onDisconnect() {
    try {
      await disconnectWhatsApp.mutateAsync();
      toast.success('WhatsApp desconectado.');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>WhatsApp</CardTitle>
            <CardDescription>
              Conecte um número para enviar confirmações, cancelamentos e lembretes de agendamento automaticamente.
            </CardDescription>
          </div>
          {!isLoading && (
            <Badge variant={isConnected ? 'success' : 'outline'}>
              {isConnected ? 'Conectado' : isConnecting ? 'Conectando…' : 'Desconectado'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}

        {!isLoading && isConnected && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="grid gap-1 rounded-md border border-border bg-muted/40 p-3">
              <p>
                <span className="text-muted-foreground">Provedor:</span>{' '}
                {connection?.provider ? PROVIDER_LABELS[connection.provider] : '—'}
              </p>
              {connection?.displayPhoneNumber && (
                <p>
                  <span className="text-muted-foreground">Número:</span> {connection.displayPhoneNumber}
                </p>
              )}
              {connection?.verifiedName && (
                <p>
                  <span className="text-muted-foreground">Nome verificado:</span> {connection.verifiedName}
                </p>
              )}
              {connection?.accountName && (
                <p>
                  <span className="text-muted-foreground">Conta Twilio:</span> {connection.accountName}
                </p>
              )}
              {connection?.provider !== 'EVOLUTION_API' && (
                <p>
                  <span className="text-muted-foreground">Remetente:</span> {connection?.phoneNumberId}
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-fit"
              disabled={disconnectWhatsApp.isPending}
              onClick={onDisconnect}
            >
              {disconnectWhatsApp.isPending ? 'Desconectando…' : 'Desconectar'}
            </Button>
          </div>
        )}

        {!isLoading && !isConnected && (
          <Tabs defaultValue="evolution">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="evolution">Evolution API</TabsTrigger>
              <TabsTrigger value="twilio">Twilio</TabsTrigger>
              <TabsTrigger value="meta">Meta Cloud API</TabsTrigger>
            </TabsList>
            <TabsContent value="evolution">
              <EvolutionConnectForm connection={connection} />
            </TabsContent>
            <TabsContent value="twilio">
              <TwilioConnectForm />
            </TabsContent>
            <TabsContent value="meta">
              <MetaConnectForm />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
