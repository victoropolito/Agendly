'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthErrorMessage } from '@/features/auth/staff-auth-context';
import { useDisconnectWhatsApp, useStartEvolutionConnection, useWhatsAppConnection } from '@/features/tenant/use-tenant';

export function WhatsAppConnectionCard() {
  const { data: connection, isLoading } = useWhatsAppConnection();
  const startConnection = useStartEvolutionConnection();
  const disconnectWhatsApp = useDisconnectWhatsApp();
  const [qrCode, setQrCode] = React.useState<string | null>(null);

  const isConnected = connection?.status === 'CONNECTED';
  const isConnecting = connection?.status === 'CONNECTING';

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

  async function onDisconnect() {
    try {
      await disconnectWhatsApp.mutateAsync();
      setQrCode(null);
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
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Conecta seu WhatsApp pessoal via QR Code, igual ao WhatsApp Web — sem cadastro de empresa.
            </p>
            {qrCode && isConnecting && (
              <div className="flex flex-col items-center gap-3 rounded-lg border border-border p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI from our own API, not an optimizable remote asset */}
                <img src={qrCode} alt="QR Code para conectar o WhatsApp" className="size-56" />
                <p className="text-center text-sm text-muted-foreground">
                  Abra o WhatsApp no celular → Configurações → Aparelhos conectados → Conectar um aparelho, e escaneie
                  o código acima.
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
        )}
      </CardContent>
    </Card>
  );
}
