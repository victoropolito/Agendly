import { Injectable, Logger } from '@nestjs/common';

import type { WhatsAppMessage, WhatsAppProvider, WhatsAppSendResult } from './whatsapp-provider.interface';

/**
 * Placeholder for the official WhatsApp Business Platform (Meta Cloud API) integration.
 * Each tenant's own number/credentials will be read from `whatsapp_connections` once implemented.
 * Until then, sends fail cleanly so the notification is recorded as FAILED rather than silently lost.
 */
@Injectable()
export class MetaCloudApiProvider implements WhatsAppProvider {
  private readonly logger = new Logger(MetaCloudApiProvider.name);

  async send(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    this.logger.warn(`Meta Cloud API provider is not configured yet. Message to ${message.to} was not sent.`);
    return { success: false, error: 'Integração com a WhatsApp Cloud API ainda não configurada.' };
  }
}
