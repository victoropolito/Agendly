import { Injectable, Logger } from '@nestjs/common';

import type { MetaSendContext, WhatsAppMessage, WhatsAppSendResult } from './whatsapp-provider.interface';

export interface WhatsAppVerifyResult {
  ok: boolean;
  displayPhoneNumber?: string;
  verifiedName?: string;
  error?: string;
}

interface GraphErrorBody {
  error?: { message?: string };
}

interface GraphSendResponseBody {
  messages?: Array<{ id?: string }>;
}

interface GraphPhoneNumberBody {
  display_phone_number?: string;
  verified_name?: string;
}

/**
 * Real integration with the official WhatsApp Business Platform (Meta Cloud API).
 * Each tenant supplies its own phone_number_id + access token (see WhatsAppConnectionService),
 * stored encrypted at rest and decrypted only for the duration of a single API call.
 */
@Injectable()
export class MetaCloudApiProvider {
  private readonly logger = new Logger(MetaCloudApiProvider.name);
  private readonly apiVersion = process.env.WHATSAPP_GRAPH_API_VERSION ?? 'v21.0';

  private get baseUrl(): string {
    return `https://graph.facebook.com/${this.apiVersion}`;
  }

  async send(message: WhatsAppMessage, context?: MetaSendContext): Promise<WhatsAppSendResult> {
    if (!context) {
      return { success: false, error: 'WhatsApp não conectado para esta barbearia.' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/${context.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${context.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.to.replace(/^\+/, ''),
          type: 'text',
          text: { body: message.body, preview_url: false },
        }),
      });

      const payload = (await response.json().catch(() => null)) as (GraphSendResponseBody & GraphErrorBody) | null;
      if (!response.ok) {
        const error = payload?.error?.message ?? `WhatsApp Cloud API respondeu ${response.status}`;
        this.logger.warn(`Falha ao enviar WhatsApp para ${message.to}: ${error}`);
        return { success: false, error };
      }

      return { success: true, providerMessageId: payload?.messages?.[0]?.id };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erro desconhecido ao chamar a WhatsApp Cloud API.';
      this.logger.error(`Erro de rede ao chamar a WhatsApp Cloud API: ${reason}`);
      return { success: false, error: reason };
    }
  }

  async verify(phoneNumberId: string, accessToken: string): Promise<WhatsAppVerifyResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${phoneNumberId}?fields=verified_name,display_phone_number`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const payload = (await response.json().catch(() => null)) as (GraphPhoneNumberBody & GraphErrorBody) | null;

      if (!response.ok) {
        return { ok: false, error: payload?.error?.message ?? `WhatsApp Cloud API respondeu ${response.status}` };
      }

      return {
        ok: true,
        displayPhoneNumber: payload?.display_phone_number,
        verifiedName: payload?.verified_name,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Erro desconhecido ao verificar a conexão.';
      return { ok: false, error: reason };
    }
  }
}
