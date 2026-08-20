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

const TRANSIENT_STATUS_CODES = new Set([502, 503, 504]);
const COLD_START_RETRIES = 3;
const COLD_START_RETRY_DELAY_MS = 5000;
const DISCONNECT_POLL_ATTEMPTS = 5;
const DISCONNECT_POLL_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
   * Our self-hosted Evolution API runs on a free-tier host that spins down when idle: the first
   * request after a while returns a 502/503/504 (or fails outright) while it wakes back up, which
   * can take up to ~1 minute. Retrying with a delay avoids surfacing that as a hard failure to the
   * admin every time they're the one who happens to wake it up.
   */
  private async fetchWithRetry(path: string, init: RequestInit): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= COLD_START_RETRIES; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, init);
        if (TRANSIENT_STATUS_CODES.has(response.status) && attempt < COLD_START_RETRIES) {
          await sleep(COLD_START_RETRY_DELAY_MS);
          continue;
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < COLD_START_RETRIES) {
          await sleep(COLD_START_RETRY_DELAY_MS);
          continue;
        }
      }
    }
    throw lastError;
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
      const response = await this.fetchWithRetry(`/instance/connectionState/${instanceName}`, { headers: this.headers });
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

  /**
   * Logs out and deletes the instance, then waits (briefly, best-effort) for the teardown to
   * actually land before returning. Evolution API's delete can return before the underlying
   * Baileys session is fully torn down; a caller that immediately recreates the instance (see
   * `ensureInstanceWithQrCode`) can otherwise race it and get a stale/reused session back — which
   * silently ignores the pairing-code request and falls back to a QR code instead.
   */
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
    for (let attempt = 0; attempt < DISCONNECT_POLL_ATTEMPTS; attempt++) {
      if ((await this.getConnectionState(instanceName)) === 'not_found') return;
      await sleep(DISCONNECT_POLL_DELAY_MS);
    }
  }

  private async createInstance(instanceName: string, phoneNumber?: string): Promise<EvolutionQrResult> {
    try {
      const response = await this.fetchWithRetry('/instance/create', {
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
        return { ok: false, error: this.errorMessageOf(payload) ?? this.statusFallbackMessage(response.status) };
      }
      return { ok: true, qrCodeBase64: payload?.qrcode?.base64, pairingCode: payload?.qrcode?.pairingCode };
    } catch (error) {
      return { ok: false, error: this.reasonOf(error) };
    }
  }

  private async refreshQrCode(instanceName: string): Promise<EvolutionQrResult> {
    try {
      const response = await this.fetchWithRetry(`/instance/connect/${instanceName}`, { headers: this.headers });
      const payload = (await response.json().catch(() => null)) as (EvolutionQrBody & EvolutionErrorBody) | null;
      if (!response.ok) {
        return { ok: false, error: this.errorMessageOf(payload) ?? this.statusFallbackMessage(response.status) };
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

  private statusFallbackMessage(status: number): string {
    if (TRANSIENT_STATUS_CODES.has(status)) {
      return 'O servidor de WhatsApp está iniciando. Aguarde um instante e tente novamente.';
    }
    return `Evolution API respondeu ${status}`;
  }

  private reasonOf(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro desconhecido ao chamar a Evolution API.';
  }
}
