import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { EvolutionSendContext, WhatsAppMessage, WhatsAppSendResult } from './whatsapp-provider.interface';

export type EvolutionConnectionState = 'open' | 'close' | 'connecting' | 'not_found';

export interface EvolutionQrResult {
  ok: boolean;
  qrCodeBase64?: string;
  pairingCode?: string | null;
  error?: string;
}

interface EvolutionQrBody {
  base64?: string;
  pairingCode?: string | null;
}

interface EvolutionCreateInstanceBody {
  qrcode?: EvolutionQrBody;
}

interface EvolutionConnectionStateBody {
  instance?: { state?: string };
}

interface EvolutionSendResponseBody {
  key?: { id?: string };
}

/** Evolution API wraps validation failures as { status, error: "Bad Request", response: { message: [...] } }. */
interface EvolutionErrorBody {
  error?: string;
  response?: { message?: unknown };
}

/**
 * Integration with a self-hosted Evolution API server (https://github.com/evolution-foundation/evolution-api),
 * a Baileys-based (WhatsApp Web protocol) gateway. Unlike Meta Cloud API / Twilio, there's no external account
 * or business verification: the barbershop's own admin links their personal WhatsApp by scanning a QR code,
 * same as WhatsApp Web. We run and own the Evolution API server (see docker-compose.yml); every tenant gets
 * its own "instance" (connection slot) on it, authenticated with our single server-wide admin API key.
 */
@Injectable()
export class EvolutionApiProvider {
  private readonly logger = new Logger(EvolutionApiProvider.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.getOrThrow<string>('EVOLUTION_API_URL');
  }

  private get headers(): Record<string, string> {
    return { apikey: this.config.getOrThrow<string>('EVOLUTION_API_KEY'), 'Content-Type': 'application/json' };
  }

  /**
   * Idempotently ensures the tenant's instance exists and returns a way to link it — either a
   * QR code to scan, or (when `phoneNumber` is given) a pairing code to type into WhatsApp
   * instead. Pairing codes can only be requested at instance creation time, so if the instance
   * already exists and a phone number is now given, the instance is recreated to get a fresh one.
   */
  async ensureInstanceWithQrCode(instanceName: string, phoneNumber?: string): Promise<EvolutionQrResult> {
    const state = await this.getConnectionState(instanceName);
    if (state === 'open') {
      return { ok: true };
    }
    if (state === 'not_found') {
      return this.createInstance(instanceName, phoneNumber);
    }
    if (phoneNumber) {
      await this.disconnect(instanceName);
      return this.createInstance(instanceName, phoneNumber);
    }
    return this.refreshQrCode(instanceName);
  }

  async getConnectionState(instanceName: string): Promise<EvolutionConnectionState> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connectionState/${instanceName}`, { headers: this.headers });
      if (response.status === 404) return 'not_found';
      if (!response.ok) return 'not_found';
      const payload = (await response.json().catch(() => null)) as EvolutionConnectionStateBody | null;
      const state = payload?.instance?.state;
      return state === 'open' || state === 'connecting' ? state : 'close';
    } catch (error) {
      this.logger.warn(`Falha ao consultar estado da instância ${instanceName}: ${this.reasonOf(error)}`);
      return 'not_found';
    }
  }

  async send(message: WhatsAppMessage, context?: EvolutionSendContext): Promise<WhatsAppSendResult> {
    if (!context) {
      return { success: false, error: 'WhatsApp (Evolution API) não conectado para esta barbearia.' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/message/sendText/${context.instanceName}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          number: message.to.replace(/^\+/, ''),
          text: message.body,
        }),
      });
      const payload = (await response.json().catch(() => null)) as (EvolutionSendResponseBody & EvolutionErrorBody) | null;
      if (!response.ok) {
        return { success: false, error: this.errorMessageOf(payload) ?? `Evolution API respondeu ${response.status}` };
      }
      return { success: true, providerMessageId: payload?.key?.id };
    } catch (error) {
      const reason = this.reasonOf(error);
      this.logger.error(`Erro de rede ao chamar a Evolution API: ${reason}`);
      return { success: false, error: reason };
    }
  }

  async disconnect(instanceName: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/instance/logout/${instanceName}`, { method: 'DELETE', headers: this.headers });
    } catch (error) {
      this.logger.warn(`Falha ao deslogar a instância ${instanceName}: ${this.reasonOf(error)}`);
    }
    try {
      await fetch(`${this.baseUrl}/instance/delete/${instanceName}`, { method: 'DELETE', headers: this.headers });
    } catch (error) {
      this.logger.warn(`Falha ao remover a instância ${instanceName}: ${this.reasonOf(error)}`);
    }
  }

  private async createInstance(instanceName: string, phoneNumber?: string): Promise<EvolutionQrResult> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/create`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          ...(phoneNumber ? { number: phoneNumber } : {}),
        }),
      });
      const payload = (await response.json().catch(() => null)) as (EvolutionCreateInstanceBody & EvolutionErrorBody) | null;
      if (!response.ok) {
        return { ok: false, error: this.errorMessageOf(payload) ?? `Evolution API respondeu ${response.status}` };
      }
      return { ok: true, qrCodeBase64: payload?.qrcode?.base64, pairingCode: payload?.qrcode?.pairingCode };
    } catch (error) {
      return { ok: false, error: this.reasonOf(error) };
    }
  }

  private async refreshQrCode(instanceName: string): Promise<EvolutionQrResult> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connect/${instanceName}`, { headers: this.headers });
      const payload = (await response.json().catch(() => null)) as (EvolutionQrBody & EvolutionErrorBody) | null;
      if (!response.ok) {
        return { ok: false, error: this.errorMessageOf(payload) ?? `Evolution API respondeu ${response.status}` };
      }
      return { ok: true, qrCodeBase64: payload?.base64, pairingCode: payload?.pairingCode };
    } catch (error) {
      return { ok: false, error: this.reasonOf(error) };
    }
  }

  private errorMessageOf(payload: EvolutionErrorBody | null): string | undefined {
    if (!payload) return undefined;
    const message = payload.response?.message;
    if (Array.isArray(message)) {
      return message.flat().join(' ');
    }
    if (typeof message === 'string') return message;
    return payload.error;
  }

  private reasonOf(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro desconhecido ao chamar a Evolution API.';
  }
}
