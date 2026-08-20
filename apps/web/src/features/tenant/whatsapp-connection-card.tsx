'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/ui/phone-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { useDisconnectWhatsApp, useStartEvolutionConnection, useWhatsAppConnection } from '@/features/tenant/use-tenant';

function QrCodeTab({ isConnecting }: { isConnecting: boolean }) {
  const startConnection = useStartEvolutionConnection();
  const [qrCode, setQrCode] = React.useState<string | null>(null);

  async function handleGenerateQr() {
    setQrCode(null);
    try {
      const result = await startConnection.mutateAsync(undefined);
      if (result.qrCodeBase64) {
        setQrCode(result.qrCodeBase64);
      } else {
        toast.success('WhatsApp já está conectado.');
      }
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Escaneie com o WhatsApp do celular, igual ao WhatsApp Web — sem cadastro de empresa.
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
      <Button type="button" onClick={() => void handleGenerateQr()} disabled={startConnection.isPending} className="w-fit">
        {startConnection.isPending ? 'Gerando…' : qrCode ? 'Gerar novo QR Code' : 'Gerar QR Code'}
      </Button>
    </div>
  );
}

function PairingCodeTab({ isConnecting }: { isConnecting: boolean }) {
  const startConnection = useStartEvolutionConnection();
  const [phone, setPhone] = React.useState('');
  const [pairingCode, setPairingCode] = React.useState<string | null>(null);

  async function handleGenerateCode() {
    if (!phone.trim()) {
      toast.error('Informe o número de WhatsApp.');
      return;
    }
    setPairingCode(null);
    try {
      const result = await startConnection.mutateAsync(phone);
      if (result.pairingCode) {
        setPairingCode(result.pairingCode);
      } else if (!result.qrCodeBase64) {
        toast.success('WhatsApp já está conectado.');
      } else {
        toast.error('A Evolution API não retornou um código de pareamento para este número.');
      }
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Sem câmera? Informe o número e digite o código diretamente no WhatsApp — sem escanear nada.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pairing-phone">Número de WhatsApp</Label>
        <PhoneInput
          id="pairing-phone"
          placeholder="(11) 99999-0000"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      {pairingCode && isConnecting && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-4">
          <p className="text-2xl font-semibold tracking-widest">{pairingCode}</p>
          <p className="text-center text-sm text-muted-foreground">
            No celular: WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho → &quot;Conectar com
            número de telefone&quot; → digite o código acima.
          </p>
          <p className="text-xs text-muted-foreground">Aguardando confirmação…</p>
        </div>
      )}
      <Button type="button" onClick={() => void handleGenerateCode()} disabled={startConnection.isPending} className="w-fit">
        {startConnection.isPending ? 'Gerando…' : pairingCode ? 'Gerar novo código' : 'Gerar código'}
      </Button>
    </div>
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
              <p>WhatsApp conectado via Evolution API.</p>
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
          <Tabs defaultValue="qrcode">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qrcode">QR Code</TabsTrigger>
              <TabsTrigger value="pairing">Código de pareamento</TabsTrigger>
            </TabsList>
            <TabsContent value="qrcode">
              <QrCodeTab isConnecting={isConnecting} />
            </TabsContent>
            <TabsContent value="pairing">
              <PairingCodeTab isConnecting={isConnecting} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
