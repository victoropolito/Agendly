import { Injectable, Logger } from '@nestjs/common';

import type { TwilioSendContext, WhatsAppMessage, WhatsAppSendResult } from './whatsapp-provider.interface';

export interface TwilioVerifyResult {
  ok: boolean;
  accountName?: string;
  error?: string;
}

interface TwilioErrorBody {
  message?: string;
}

interface TwilioSendResponseBody {
  sid?: string;
}

interface TwilioAccountBody {
  friendly_name?: string;
}

/**
 * Integration with Twilio's WhatsApp API. Unlike the Meta Cloud API, Twilio offers a free
 * "Sandbox" mode (a shared number + join code, no business verification) that's a much faster
 * path to testing real WhatsApp delivery during development.
 * Note: sandbox recipients must first send "join <code>" to the sandbox number from their own
 * WhatsApp before Twilio will deliver messages to them.
 */
@Injectable()
export class TwilioWhatsAppProvider {
  private readonly logger = new Logger(TwilioWhatsAppProvider.name);
  private readonly baseUrl = 'https://api.twilio.com/2010-04-01';

  async send(message: WhatsAppMessage, context?: TwilioSendContext): Promise<WhatsAppSendResult> {
    if (!context) {
      return { success: false, error: 'WhatsApp (Twilio) não conectado para esta barbearia.' };
    }

    const body = new URLSearchParams({
      From: `whatsapp:${context.fromNumber}`,
      To: `whatsapp:${message.to}`,
      Body: message.body,
    });

    try {
      const response = await fetch(`${this.baseUrl}/Accounts/${context.accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: this.basicAuth(context.accountSid, context.authToken),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const payload = (await response.json().catch(() => null)) as (TwilioSendResponseBody & TwilioErrorBody) | null;
      if (!response.ok) {
        const error = payload?.message ?? `Twilio respondeu ${response.status}`;
        this.logger.warn(`Falha ao enviar WhatsApp (Twilio) para ${message.to}: ${error}`);
        return { success: false, error };
      }

      return { success: true, providerMessageId: payload?.sid };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erro desconhecido ao chamar a API do Twilio.';
      this.logger.error(`Erro de rede ao chamar a API do Twilio: ${reason}`);
      return { success: false, error: reason };
    }
  }

  async verify(accountSid: string, authToken: string): Promise<TwilioVerifyResult> {
    try {
      const response = await fetch(`${this.baseUrl}/Accounts/${accountSid}.json`, {
        headers: { Authorization: this.basicAuth(accountSid, authToken) },
      });
      const payload = (await response.json().catch(() => null)) as (TwilioAccountBody & TwilioErrorBody) | null;

      if (!response.ok) {
        return { ok: false, error: payload?.message ?? `Twilio respondeu ${response.status}` };
      }

      return { ok: true, accountName: payload?.friendly_name };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erro desconhecido ao verificar a conexão.';
      return { ok: false, error: reason };
    }
  }

  private basicAuth(accountSid: string, authToken: string): string {
    return `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
  }
}
